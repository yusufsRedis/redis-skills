---
title: Use Redis Search for Complex Queries
impact: MEDIUM
impactDescription: enables full-text search and secondary indexes
tags: redis-stack, search, indexing, queries
---

## Use Redis Search for Complex Queries

Use Redis Search (RediSearch) for full-text search, filtering, and aggregations instead of scanning keys. It provides secondary indexes for fast lookups on any field.

**Incorrect (scanning and filtering in application):**

```python
import redis
import json
r = redis.Redis(decode_responses=True)

# Scanning all keys to find matches - very slow
def find_users_by_city(city):
    results = []
    for key in r.scan_iter(match="user:*"):
        data = r.hgetall(key)
        if data.get("city") == city:
            results.append(data)
    return results
```

**Correct (use Redis Search indexes):**

```python
import redis
from redis.commands.search.field import TextField, NumericField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from redis.commands.search.aggregation import AggregateRequest, Asc

r = redis.Redis(decode_responses=True)

# Create index on hash keys (run once during setup)
def create_user_index():
    try:
        # Define schema
        schema = (
            TextField("name", weight=2.0),  # Higher weight for name matches
            TextField("email"),
            TagField("city"),  # Tag for exact matches
            NumericField("age"),
            NumericField("created_at", sortable=True),
        )

        # Create index on keys matching "user:*"
        r.ft("idx:users").create_index(
            schema,
            definition=IndexDefinition(
                prefix=["user:"],
                index_type=IndexType.HASH
            )
        )
    except redis.ResponseError as e:
        if "Index already exists" not in str(e):
            raise

# Store users as hashes (automatically indexed)
r.hset("user:1", mapping={
    "name": "John Doe",
    "email": "john@example.com",
    "city": "NYC",
    "age": 30,
    "created_at": 1704067200
})

# Search by city (exact match with tag)
def find_users_by_city(city):
    query = Query(f"@city:{{{city}}}")
    return r.ft("idx:users").search(query)

# Full-text search in name
def search_users_by_name(name_query):
    query = Query(f"@name:{name_query}*")  # Prefix search
    return r.ft("idx:users").search(query)

# Complex query with multiple conditions
def find_users(city=None, min_age=None, max_age=None, search_text=None):
    query_parts = []

    if city:
        query_parts.append(f"@city:{{{city}}}")
    if min_age is not None:
        query_parts.append(f"@age:[{min_age} +inf]")
    if max_age is not None:
        query_parts.append(f"@age:[-inf {max_age}]")
    if search_text:
        query_parts.append(f"@name|email:{search_text}")

    query_string = " ".join(query_parts) if query_parts else "*"
    query = Query(query_string).paging(0, 100)

    return r.ft("idx:users").search(query)

# Aggregation example
def count_users_by_city():
    """Count users grouped by city"""
    request = AggregateRequest("*").group_by(
        "@city",
        reducers=[
            r.ft("idx:users").aggregation().count().alias("count")
        ]
    )
    return r.ft("idx:users").aggregate(request)

# Sorting and pagination
def list_users_paginated(page=0, page_size=20, sort_by="created_at"):
    query = Query("*").sort_by(sort_by, asc=False).paging(
        page * page_size, page_size
    )
    return r.ft("idx:users").search(query)

# JSON document search (with RedisJSON)
def create_product_index():
    """Index JSON documents"""
    schema = (
        TextField("$.name", as_name="name"),
        NumericField("$.price", as_name="price"),
        TagField("$.category", as_name="category"),
    )

    r.ft("idx:products").create_index(
        schema,
        definition=IndexDefinition(
            prefix=["product:"],
            index_type=IndexType.JSON
        )
    )
```

Create indexes on fields you query frequently. Use TagField for exact matches, TextField for full-text search, NumericField for ranges. Indexes update automatically when data changes.

Reference: [Redis Search](https://redis.io/docs/latest/develop/interact/search-and-query/)
