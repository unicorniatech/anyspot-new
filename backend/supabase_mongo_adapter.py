import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from supabase import Client, create_client


@dataclass
class DeleteResult:
    deleted_count: int


class SupabaseQuery:
    def __init__(self, collection: "SupabaseCollection", query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, int]] = None):
        self.collection = collection
        self.query = query or {}
        self.projection = projection or {}
        self.sort_field: Optional[str] = None
        self.sort_direction: int = 1
        self.limit_count: Optional[int] = None

    def sort(self, field: str, direction: int):
        self.sort_field = field
        self.sort_direction = direction
        return self

    def limit(self, n: int):
        self.limit_count = n
        return self

    async def to_list(self, n: Optional[int] = None):
        rows = await self.collection._select_all_rows()
        rows = [r for r in rows if self.collection._matches_query(r, self.query)]

        if self.sort_field:
            reverse = self.sort_direction < 0
            rows.sort(key=lambda r: r.get(self.sort_field), reverse=reverse)

        max_items = n if n is not None else self.limit_count
        if max_items is not None:
            rows = rows[:max_items]

        if self.projection:
            rows = [self.collection._apply_projection(r, self.projection) for r in rows]
        return rows


class SupabaseCollection:
    PRIMARY_KEYS = {
        "users": ["user_id"],
        "user_sessions": ["session_token"],
        "studios": ["id"],
        "classes": ["id"],
        "bookings": ["id"],
        "studio_team_invites": ["id"],
        "studio_members": ["studio_id", "user_id"],
    }

    def __init__(self, client: Client, table_name: str):
        self.client = client
        self.table_name = table_name

    async def _select_all_rows(self) -> List[Dict[str, Any]]:
        data = self.client.table(self.table_name).select("*").execute().data or []
        return data

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, int]] = None):
        return SupabaseQuery(self, query=query, projection=projection)

    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict[str, int]] = None, sort: Optional[List[Tuple[str, int]]] = None):
        rows = await self._select_all_rows()
        rows = [r for r in rows if self._matches_query(r, query)]

        if sort:
            for field, direction in reversed(sort):
                rows.sort(key=lambda r: r.get(field), reverse=direction < 0)

        if not rows:
            return None

        row = rows[0]
        if projection:
            return self._apply_projection(row, projection)
        return row

    async def count_documents(self, query: Dict[str, Any]):
        rows = await self._select_all_rows()
        return len([r for r in rows if self._matches_query(r, query)])

    async def insert_one(self, doc: Dict[str, Any]):
        self.client.table(self.table_name).insert(doc).execute()

    async def insert_many(self, docs: List[Dict[str, Any]]):
        if not docs:
            return
        self.client.table(self.table_name).insert(docs).execute()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        row = await self.find_one(query)
        if not row:
            return

        patch = self._build_patch_from_update(row, update)
        if not patch:
            return

        self._update_by_primary_key(row, patch)

    async def update_many(self, query: Dict[str, Any], update: Any):
        rows = await self._select_all_rows()
        rows = [r for r in rows if self._matches_query(r, query)]

        for row in rows:
            patch = self._build_patch_from_update(row, update)
            if patch:
                self._update_by_primary_key(row, patch)

    async def delete_one(self, query: Dict[str, Any]):
        row = await self.find_one(query)
        if not row:
            return DeleteResult(deleted_count=0)

        self._delete_by_primary_key(row)
        return DeleteResult(deleted_count=1)

    async def delete_many(self, query: Dict[str, Any]):
        rows = await self._select_all_rows()
        rows = [r for r in rows if self._matches_query(r, query)]

        deleted = 0
        for row in rows:
            self._delete_by_primary_key(row)
            deleted += 1

        return DeleteResult(deleted_count=deleted)

    def _update_by_primary_key(self, row: Dict[str, Any], patch: Dict[str, Any]):
        pk = self.PRIMARY_KEYS.get(self.table_name, ["id"])
        q = self.client.table(self.table_name).update(patch)
        for key in pk:
            q = q.eq(key, row.get(key))
        q.execute()

    def _delete_by_primary_key(self, row: Dict[str, Any]):
        pk = self.PRIMARY_KEYS.get(self.table_name, ["id"])
        q = self.client.table(self.table_name).delete()
        for key in pk:
            q = q.eq(key, row.get(key))
        q.execute()

    def _build_patch_from_update(self, row: Dict[str, Any], update: Any) -> Dict[str, Any]:
        patch: Dict[str, Any] = {}

        if isinstance(update, list):
            for stage in update:
                set_part = stage.get("$set", {})
                for k, v in set_part.items():
                    if isinstance(v, str) and v.startswith("$"):
                        patch[k] = row.get(v[1:])
                    else:
                        patch[k] = v
            return patch

        if "$set" in update:
            patch.update(update["$set"])

        if "$inc" in update:
            for k, delta in update["$inc"].items():
                patch[k] = (row.get(k) or 0) + delta

        return patch

    def _matches_query(self, row: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True

        for key, value in query.items():
            if key == "$or":
                if not any(self._matches_query(row, clause) for clause in value):
                    return False
                continue

            row_value = row.get(key)
            if isinstance(value, dict):
                for op, op_val in value.items():
                    if op == "$gte":
                        if row_value is None or row_value < op_val:
                            return False
                    elif op == "$lte":
                        if row_value is None or row_value > op_val:
                            return False
                    elif op == "$in":
                        if row_value not in op_val:
                            return False
                    elif op == "$regex":
                        flags = re.IGNORECASE if value.get("$options") == "i" else 0
                        if row_value is None or re.search(op_val, str(row_value), flags) is None:
                            return False
                    elif op == "$options":
                        continue
                    else:
                        return False
            else:
                if row_value != value:
                    return False

        return True

    def _apply_projection(self, row: Dict[str, Any], projection: Dict[str, int]) -> Dict[str, Any]:
        if projection.get("_id") == 0:
            projected = dict(row)
            projected.pop("_id", None)
            return projected
        return row


class SupabaseDB:
    def __init__(self, client: Client):
        self.client = client

    def __getattr__(self, item: str):
        return SupabaseCollection(self.client, item)


def create_supabase_db(supabase_url: str, service_role_key: str) -> SupabaseDB:
    client = create_client(supabase_url, service_role_key)
    return SupabaseDB(client)
