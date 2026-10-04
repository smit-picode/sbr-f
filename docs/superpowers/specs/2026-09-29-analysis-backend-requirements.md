# Analysis module — backend & database requirements

**Date:** 2026-09-29 · **Frontend:** `sbr-frontend/src/features/analysis` (built on dummy data) · **Targets:** `sbr-backend` (Express, `/api/v1`) and `NPC_SBR/db` (Oracle, `SBR` / `SBR_APP`)

The frontend already runs against an in-browser stand-in whose request/response shapes **are** the contract below. Canonical types: `sbr-frontend/src/types/analysis.types.ts`. Reference implementation of every computation (grouping, top-N + Other, compare, flows, completeness, disclosure flags): `sbr-frontend/src/features/analysis/engine/query.ts`. Swapping in the backend replaces one file (`features/analysis/api/analysisService.ts`) plus the `localStorage` store.

---

## 0. What exists vs. what is missing

| Need | Today | Gap |
|---|---|---|
| Saved analyses + sharing | — | New tables + CRUD API |
| Frozen frames for all 5 entities | Designed in **NPC-253** (`SBR_SNAPSHOTS` registry + 5 shared `*_SNAPSHOT` tables + `SNAP_PKG`), in progress | Reuse it; a few additions needed — §3.4 |
| Flat, analysis-ready rows (curated joins) | Joins done ad hoc (e.g. `home.controller.ts`) | One view per entity, defined twice: over live tables and over NPC-253 snapshot tables |
| Municipality names | Hardcoded map in `utils/enums.ts:699` | `SBR_MUNICIPALITY_LKP` (codes → EN/AR names, zones) |
| ISIC section letter | `SBR_ISIC_LKP` has levels 2–4 and section *names*, no letter | Section letter per division |
| Aggregation endpoint | — | `POST /analysis/query` (whitelisted dynamic SQL) |
| Statement timeout / rate limit | None / commented out | Needed for an ad-hoc query endpoint |
| Column-level permissions | None (placeholder admin page) | Not required for v1 — see §7 |

---

## 1. Phasing (suggested)

1. **Phase 1 — live frame only.** Permissions, saved analyses CRUD + sharing, lookups, live mart views, `POST /analysis/query` (aggregate, records, completeness), `GET /analysis/frames` returning only `live`. Frontend hides compare/flow blocks when only one frame exists.
2. **Phase 2 — frozen frames** (depends on NPC-253). `V_AN_*_SNAP` views over the NPC-253 snapshot tables, frames list from `SBR_SNAPSHOTS`, compare / trend / flow requests, snapshot-aware caching.
3. **Phase 3 — hardening.** Server-side export streaming, export audit, column-level permissions if/when they land.

---

## 2. Permissions (SBR_APP)

Seed via a migration (`SBR_APP/migrations/YYYYMMDD-N_analysis_permissions.sql`), same MERGE pattern as `006_seed_rbac.sql`, SECTION_NAME `Analysis`; add to `PERMISSION` enum in `src/utils/enums.ts`.

| Key | Grants |
|---|---|
| `analysis.view` | Open the module, run queries, view analyses owned by or shared with the user |
| `analysis.edit` | Create analyses (editing an existing one additionally needs ownership or an `edit` share) |
| `analysis.export_unsuppressed` | Receive / export **unsuppressed** confidential cells. Without it the server masks them (see §5.6) |

Frontend today: nav entry ungated, `canCreate` = `analysis.edit` or SUPER_ADMIN, export-unsuppressed checked the same way. Once seeded, set `permKey: 'analysis.view'` on the nav item.

---

## 3. Database

### 3.1 Saved analyses (SBR_APP)

The report definition (frame, compare, filters, blocks) is stored as **one JSON CLOB**. The server never queries inside it; keeping it opaque lets the block schema evolve without migrations.

```sql
CREATE TABLE SBR_ANALYSIS (
  ID              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  NAME            VARCHAR2(200 CHAR)  NOT NULL,
  DESCRIPTION     VARCHAR2(1000 CHAR),
  OWNER_USER_ID   NUMBER              NOT NULL REFERENCES SBR_USER(ID),
  DEFINITION      CLOB                NOT NULL CHECK (DEFINITION IS JSON),
  SCHEMA_VERSION  NUMBER(3)   DEFAULT 1 NOT NULL,
  ROW_VERSION     NUMBER(10)  DEFAULT 1 NOT NULL,     -- optimistic concurrency
  IS_DELETED      CHAR(1)     DEFAULT 'N' NOT NULL CHECK (IS_DELETED IN ('Y','N')),
  CREATED_AT      TIMESTAMP   DEFAULT SYSTIMESTAMP NOT NULL,
  UPDATED_AT      TIMESTAMP   DEFAULT SYSTIMESTAMP NOT NULL,
  UPDATED_BY      NUMBER      REFERENCES SBR_USER(ID)
);
CREATE INDEX SBR_ANALYSIS_OWNER_IX ON SBR_ANALYSIS (OWNER_USER_ID, IS_DELETED);

CREATE TABLE SBR_ANALYSIS_SHARE (
  ID              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ANALYSIS_ID     NUMBER       NOT NULL REFERENCES SBR_ANALYSIS(ID) ON DELETE CASCADE,
  PRINCIPAL_TYPE  VARCHAR2(10) NOT NULL CHECK (PRINCIPAL_TYPE IN ('USER','ROLE')),
  PRINCIPAL_ID    NUMBER       NOT NULL,              -- SBR_USER.ID or SBR_ROLE.ID
  ACCESS_LEVEL    VARCHAR2(10) NOT NULL CHECK (ACCESS_LEVEL IN ('VIEW','EDIT')),
  GRANTED_BY      NUMBER       NOT NULL REFERENCES SBR_USER(ID),
  GRANTED_AT      TIMESTAMP    DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT SBR_ANALYSIS_SHARE_UQ UNIQUE (ANALYSIS_ID, PRINCIPAL_TYPE, PRINCIPAL_ID)
);
CREATE INDEX SBR_ANALYSIS_SHARE_PR_IX ON SBR_ANALYSIS_SHARE (PRINCIPAL_TYPE, PRINCIPAL_ID);
```

`DEFINITION` JSON = the frontend `Analysis` object minus `id / name / description / owner* / createdAt / updatedAt / shares`, i.e. `{ frame, compareTo, filters, blocks }`.

**Access rule** (resolve in one place, e.g. `SBR_ANALYSIS_API.GET_ACCESS`): owner → EDIT; else the best of (a) a **user share** naming this user and (b) **role shares** on any role the user holds — every user holding that role gets access, using all roles in `MAPPING_SBR_USER_SBR_ROLE` (not just the active one) and ignoring expired assignments (`EXPIRES_AT`); else none. SUPER_ADMIN → EDIT. Both share kinds are supported by the frontend share dialog already.

### 3.2 Lookups (SBR)

```sql
CREATE TABLE SBR_MUNICIPALITY_LKP (
  MUNICIPALITY_ID VARCHAR2(20) PRIMARY KEY,   -- same codes as SBR_ADDRESSES.MUNICIPALITY_ID ('1'..'8')
  NAME_ENG        VARCHAR2(100) NOT NULL,     -- MUST equal the map's GeoJSON shapeName (below)
  NAME_AR         VARCHAR2(100) NOT NULL
);
CREATE TABLE SBR_ZONE_LKP (
  ZONE_NO         NUMBER PRIMARY KEY,
  MUNICIPALITY_ID VARCHAR2(20) NOT NULL REFERENCES SBR_MUNICIPALITY_LKP(MUNICIPALITY_ID)
);
```
`NAME_ENG` values the map joins on exactly: `Doha`, `Al Rayyan`, `Al Wakra`, `Umm Slal`, `Al Khor and Al Thakhira`, `Al Daayen`, `Al Shamal`, `Al Sheehaniya`. Unknown codes (e.g. `9`, `51` seen in the real data) → leave the municipality NULL in the mart and log them.

ISIC section letter: add `ISIC_SECTION CHAR(1)` to `SBR_ISIC_LKP` (populate from division ranges: A 01–03, B 05–09, C 10–33, D 35, E 36–39, F 41–43, G 45–47, H 49–53, I 55–56, J 58–63, K 64–66, L 68, M 69–75, N 77–82, O 84, P 85, Q 86–88, R 90–93, S 94–96, T 97–98, U 99). Section/division EN+AR names are already in the lookup; the frontend currently ships its own copies and can switch to the lookup later.

### 3.3 Analysis mart — one flat row per unit, per entity

Every analysis query runs against **one flat row shape per entity** that already contains the curated joins. Column names = the frontend field ids (so the whitelist is trivial). Each shape is defined twice with identical columns: `V_AN_<ENTITY>` over the live tables (current SCD2 rows) and `V_AN_<ENTITY>_SNAP` over the NPC-253 snapshot tables (§3.4).

**Views** (SBR, granted to SBR_APP): `V_AN_ESTABLISHMENT`, `V_AN_ENTERPRISE`, `V_AN_ENTERPRISE_GROUP`, `V_AN_CONTACT`, `V_AN_ADDRESS`, and their `_SNAP` twins. Keep the join logic in one place, e.g. generate both from a shared template in the migration, so the two never drift. If the establishment view is slow (it joins 5 tables over ~115k rows), turn it into an `ON DEMAND` materialized view refreshed at the end of each pipeline run and after approvals are applied.

Field mapping (current rows = `VALID_TO IS NULL` everywhere):

| Field id | Type | Source |
|---|---|---|
| `sbr_id` | id | `E.SBR_ID` |
| `name` | text | `NVL(E.NPC_NAME_ENU, E.NAME_ENU)` (EN name; AR variant optional) |
| `status` | category | `E.EST_STATUS` |
| `source` | category | `E.SOURCE_CODE` |
| `sector` | category | `E.SECTOR_ID` |
| `legal_type` | category | `E.LEGAL_TYPE` |
| `main_branch` | category | `E.MAIN_BRANCH_FLG` |
| `reg_year` | category | `TO_CHAR(COALESCE(E.REG_DATE, E.CR_ISSUE_DATE),'YYYY')` (confirm the right date) |
| `isic_class` / `isic_group` / `isic_division` | category | `E.ISIC_CODE` / `SUBSTR(…,1,3)` / `SUBSTR(…,1,2)` |
| `isic_section` | category | `SBR_ISIC_LKP.ISIC_SECTION` via division |
| `employment` | number | `NULLIF(E.EMPLOYMENT_COUNT,0)` (0 = unknown, per the aggregates notes) |
| `size_class` | category | from `EMPLOYMENT_SIZE_CATEGORY` → `micro` 1–9, `small` 10–49, `medium` 50–249, `large` 250+, else NULL |
| `municipality` / `zone` | category | best address (`ROW_NUMBER() OVER (PARTITION BY SBR_ID ORDER BY PRIORITY DESC, ID DESC) = 1`) → `SBR_MUNICIPALITY_LKP.NAME_ENG`, `'Zone ' || ZONE` |
| `has_address` / `has_coordinates` | boolean | best address exists / `LATITUDE` & `LONGITUDE` both parseable & non-zero |
| `has_phone` / `has_email` / `has_website` | boolean | `EXISTS` a current contact with `PHONE`/`MOBILE`, `EMAIL`, `WEBSITE` |
| `enterprise_id` | id | `E.ASSOCIATED_ENTERPRISE_ID` |
| `turnover` | number | `ENT.ANNUAL_TURNOVER` |
| `foreign_controlled` / `parent_country` | boolean / category | enterprise FDI columns (exact names to confirm) |
| `group_id` / `in_group` | id / boolean | `ENT.ENTERPRISE_GROUP_ID` / `IS NOT NULL` |
| `group_type` | category | derive: `Multinational` if `MULTINATIONAL_GROUP_FLG='Y'`, `Foreign-controlled` if `FOREIGN_CONTROLLED_GROUP_FLG='Y'`, else `Domestic` |
| `uci_country` / `multinational` | category / boolean | group `UCI_COUNTRY` / `MULTINATIONAL_GROUP_FLG='Y'` |

- **Enterprises** (`V_AN_ENTERPRISE`): `enterprise_id, name, status, sector, legal_type, reg_year, isic_*, employment (EMPLOYMENT_COUNT), size_class, turnover, establishment_count (COUNT of current member establishments), foreign_ownership_pct, foreign_controlled, parent_country, municipality (main establishment's), group_id, in_group, group_type, uci_country, multinational`.
- **Groups** (`V_AN_ENTERPRISE_GROUP`): `group_id, name, status, group_type, uci_country, multinational, foreign_controlled, reg_year (GROUP_START_DATE), isic_division (PRINCIPAL_ISIC_2DIGIT), isic_section, employment (TOTAL_EMPLOYEES), size_class, turnover (TOTAL_TURNOVER), enterprise_count, establishment_count`.
- **Contacts** (`V_AN_CONTACT`, one row per current contact): `contact_id (ID), role, contact_source (SOURCE_CODE), has_phone, has_mobile, has_email, has_website` + the establishment's `sbr_id, name, status, source, sector, isic_section, isic_division, size_class, municipality`.
- **Addresses** (`V_AN_ADDRESS`, one row per current address): `address_id (ID), address_source, municipality, zone, has_street, has_building, has_coordinates` + establishment `sbr_id, name, status, source, sector, isic_section, isic_division, size_class`.

The per-entity field lists the frontend expects are in `features/analysis/constants/index.ts` (`ANALYSIS_ENTITIES[*].fields`). Booleans may be stored as `'Y'/'N'`; the API must emit them as JSON booleans in records and as keys `"true"`/`"false"` in aggregates.

### 3.4 Frozen frames — built on NPC-253 (Phase 2)

Frozen frames **are** the snapshots from [NPC-253](https://linear.app/npc-sbr/issue/NPC-253) ("Snapshot management: Create/Browse Snapshot portal pages + SNAP_PKG", design revised 2026-09-23). No separate analysis snapshot mechanism is needed: the portal's **Create Snapshot** page and the Analysis module's frame picker read the same registry.

What NPC-253 provides (as designed):
- `SBR.SBR_SNAPSHOTS` registry — `SNAPSHOT_ID` (sequence), `SNAPSHOT_NAME`, `DESCRIPTION`, `CREATED_AT`, `FROZEN_BY_USER_ID`, `STATUS` (`IN_PROGRESS`/`COMPLETE`/`FAILED`), 5 cached counts.
- 5 shared tables `SBR_ESTABLISHMENTS_SNAPSHOT`, `SBR_ENTERPRISES_SNAPSHOT`, `SBR_ENTERPRISE_GROUPS_SNAPSHOT`, `SBR_ADDRESSES_SNAPSHOT`, `SBR_CONTACTS_SNAPSHOT` — current rows (`VALID_TO IS NULL`) of each base table plus `SNAPSHOT_ID`.
- `SNAP_PKG.MAIN` freezes all 5 in one action; `SBR_APP.SBR_SNAPSHOTS_API` (`CREATE_SNAPSHOT`, `GET_LIVE_COUNTS`, `LIST_SNAPSHOTS`, `GET_SNAPSHOT_TABLE`).

Why raw copies are enough for analysis: all five tables are captured together, so the curated joins (establishment → best address, contacts, enterprise via `ASSOCIATED_ENTERPRISE_ID`, group via `ENTERPRISE_GROUP_ID`) can be done **inside one `SNAPSHOT_ID`** at query time with exactly the same logic as the live views. That is why §3.3 defines each view twice over the same column list:

- live: `V_AN_<ENTITY>` over the base tables, `VALID_TO IS NULL`;
- frozen: `V_AN_<ENTITY>_SNAP` over the `*_SNAPSHOT` tables, joining on `SNAPSHOT_ID` as well as the business keys, exposing `SNAPSHOT_ID` as a column so `WHERE SNAPSHOT_ID = :id` is pushed down.

Lookups (ISIC, municipality) are **not** snapshotted: frames store codes, and lookups only change labels.

**Additions the Analysis module needs from NPC-253** (proposed as an update to the issue):

1. **One consistent instant.** Read all five tables `AS OF SCN :scn`, capturing the SCN once at the start of `MAIN`, so a pipeline run or an approval committing mid-freeze can't leave establishments and addresses from two different moments.
2. **Physical layout for querying, not just browsing.** Partition the 5 snapshot tables `BY LIST (SNAPSHOT_ID) AUTOMATIC`. The minimum alternative is composite indexes on `(SNAPSHOT_ID, SBR_ID)` for establishments, addresses and contacts, `(SNAPSHOT_ID, ENTERPRISE_ID)` and `(SNAPSHOT_ID, ENTERPRISE_GROUP_ID)`. A single-column `SNAPSHOT_ID` index isn't enough once the tables hold dozens of frames × ~430k rows and every analysis query joins within a frame.
3. **Explicit column lists, not `SELECT *`.** An `INSERT … SELECT *` into a shared table breaks the next time a base table gains a column. Add each new base column to its snapshot table in the same migration; older frames keep NULL.
4. **Immutability enforced in the database.** This settles the issue's open follow-up: only `SNAP_PKG` may write; no `UPDATE`/`DELETE` grants to `SBR_APP`/`SBR_BE`; ideally a trigger rejecting changes to rows whose snapshot is `COMPLETE`. Saved analyses quote numbers from frames, so a frame that changes silently is a correctness bug.
5. **No hard deletes of `COMPLETE` snapshots.** If frames ever need hiding, add an `ARCHIVED` status. `LIST_SNAPSHOTS` hides archived frames, but `SBR_ANALYSIS_API` can still resolve them for analyses that reference them. The frontend falls back to the live frame, with a notice, when a referenced frame is unavailable.
6. **Grants.** `SELECT` on the 5 snapshot tables and on `SBR_SNAPSHOTS` to `SBR_APP`, for the `V_AN_*_SNAP` views and `SBR_ANALYSIS_API`. `GET_SNAPSHOT_TABLE` needs this anyway.
7. **Optional: back-fill historic frames.** A `SNAP_PKG.BACKFILL(p_name, p_as_of, p_user_id, p_snapshot_id OUT)` member rebuilds a frame point-in-time from SCD2 (`VALID_FROM <= :d AND (VALID_TO IS NULL OR VALID_TO > :d)`), using the dated `SBR_ESTABLISHMENTS_SNAPSHOT_YYYYMMDD` tables for establishments where they exist. The registry gets `SNAPSHOT_KIND` (`CAPTURED`/`RECONSTRUCTED`) and `AS_OF_DATE` (= `CREATED_AT` for captured frames), and the UI labels reconstructed frames as such. Without this, trends and comparisons start from the first snapshot taken after go-live.

**Frame resolution** (query package): `frame = 'live'` → `V_AN_<ENTITY>`; `frame = '<SNAPSHOT_ID>'` → `V_AN_<ENTITY>_SNAP WHERE SNAPSHOT_ID = :id`, with the snapshot required to be `COMPLETE` (or `ARCHIVED`). Size: ~430k rows per frame across the 5 tables (tens of MB); retention is "never purge", per NPC-253.

---

## 4. API (sbr-backend, `/api/v1`)

All routes: `auth({ usersAllowed: ['*'] })` → `requirePermission(PERMISSION.ANALYSIS_VIEW)` → Joi `validate` → controller. Standard envelope `{ success, message, data[, total, page, limit] }`. New module: `routes/analysis/analysis.routes.ts`, `controllers/analysis/*.controller.ts`, `validators/analysis/*.validator.ts`, DB calls via `SBR_APP.SBR_ANALYSIS_API`.

### 4.1 Frames

`GET /analysis/frames` → `AnalysisFrame[]`, newest first, live first:
```json
[{ "id": "live", "label": "Live frame", "asOf": "2026-09-16", "kind": "live" },
 { "id": "12", "label": "Jul 2026", "asOf": "2026-07-20", "kind": "frozen" }]
```
Source: `SBR_SNAPSHOTS` with `STATUS = 'COMPLETE'` (reuse `SBR_SNAPSHOTS_API.LIST_SNAPSHOTS`); `label` = `SNAPSHOT_NAME`, `asOf` = `AS_OF_DATE` (or `CREATED_AT`), `id` = `SNAPSHOT_ID` as a string. `asOf` for live = date of the last pipeline run. Add `"reconstructed": true` for back-filled frames if §3.4 item 7 is done.

### 4.2 Query — `POST /analysis/query`

Body = `AnalysisRequest` (discriminated by `kind`); response `data` = matching `AnalysisResult`. The frontend sends **resolved** queries: report filters, cross-filters and drill filters are already merged into `query.filters`, and `frame`/`compareTo` are concrete.

```ts
type AnalysisRequest =
  | { kind: 'aggregate';    query: Q }
  | { kind: 'records';      query: Q; page: number; pageSize: number; sortBy: string | null; sortDir: 'asc'|'desc' }
  | { kind: 'completeness'; query: Q }
  | { kind: 'flow';         query: Q };

interface Q {
  entity: 'establishments'|'enterprises'|'enterpriseGroups'|'contacts'|'addresses';
  frame: string;                 // 'live' | snapshot id
  compareTo: string | null;      // second frame, aggregate only
  dimensions: string[];          // 0..2 field ids; may include '__frame' (one bucket per COMPLETE frame + live, chronological)
  measures: { id: string; agg: 'count'|'count_distinct'|'sum'|'avg'|'median'|'min'|'max'; field: string | null }[]; // 1..4
  filters: { id: string; field: string; op: 'in'|'not_in'|'between'|'contains'|'empty'|'not_empty';
             values?: (string|null)[]; min?: number|null; max?: number|null; text?: string }[];
  sort: 'value_desc'|'value_asc'|'key_asc'|'key_desc';
  limit: number | null;          // top-N on dimension 0
  otherBucket: boolean;          // fold the rest into key "__other__" instead of dropping
  seriesLimit?: number | null;   // cap on dimension 1 (default 10; null = no cap)
  columns: string[];             // records: columns to return; completeness: fields to check
}
```

**Semantics** (match `engine/query.ts`):
- Filters whose field doesn't exist on the entity are **ignored**, not rejected (report-wide filters apply only where they fit).
- `in` / `not_in`: match on the value's string key; `null` in `values` matches missing values. `between`: numeric, inclusive, open-ended when a bound is null. `contains`: case-insensitive substring. `empty` / `not_empty`: `IS NULL` / `IS NOT NULL`.
- Keys are strings: category values as-is, booleans `"true"`/`"false"`, missing `null`, other bucket `"__other__"`, `__frame` buckets = frame ids.
- Top-N ranks dimension-0 categories by **unit count** (not by the measure); dimension 1 capped by `seriesLimit`.
- `count` = number of units; `count_distinct` = distinct non-null values of `field`; numeric aggs ignore nulls; `avg` rounded to 1 decimal.
- Compare: same query on `compareTo`, same kept categories; rows present in only one frame get 0 on the other side.
- Sorting: `value_*` by the first measure; ordered dimensions (`size_class`, `reg_year`, `__frame`) keep natural order; `null` and `__other__` always last.

**Result shapes**

```ts
// aggregate
{ kind: 'aggregate', dimensions: string[], measures: M[], frame: string, compareTo: string | null,
  rows: { keys: (string|null)[], values: (number|null)[], n: number,           // n = contributing units
          prev?: (number|null)[], prevN?: number,
          flag?: 'min'|'dominance'|'secondary' }[],
  total: { values: (number|null)[], n: number, prev?: (number|null)[], prevN?: number } }

// records
{ kind: 'records', columns: string[], rows: Record<string, unknown>[], total: number, page: number, pageSize: number }

// completeness — share filled (0..1); last column = overall; groups = top `limit` categories of dimensions[0] by n
{ kind: 'completeness', fields: string[], groups: (string|null)[], cells: number[][], groupN: number[] }

// flow — units matched by entity id between compareTo (A) and frame (B)
{ kind: 'flow', frame, compareTo, start, births, deaths, movedIn, movedOut, end, unchanged,
  links: { from: string|null, to: string|null, value: number }[] }   // from/to may be "__new__", "__ceased__", "__outside__"
```

Flow definitions: `start`/`end` = units passing the filters in A/B; **births** = in B-filtered and not in A at all; **deaths** = in A-filtered and not in B at all; **movedIn/movedOut** = exist in both frames but cross the filter boundary; **unchanged** = in both filtered sets with the same `dimensions[0]` value (not listed in `links`). If `compareTo` is null, use the oldest COMPLETE frame.

**Validation / limits** (Joi + package whitelist): entity ∈ 5; every field id ∈ that entity's whitelist; `dimensions` ≤ 2 (+`__frame`), `measures` 1–4, non-count aggs need a numeric field (`count_distinct` any field), `filters` ≤ 30, `values` ≤ 500 per filter, `text` ≤ 200 chars, `limit` ∈ {5,10,15,20,50,null}, `pageSize` ≤ 100, `columns` ≤ 20, frame ids must be `live` or a COMPLETE/ARCHIVED snapshot. Invalid → 400.

### 4.3 Saved analyses

| Method & path | Body / query | Notes |
|---|---|---|
| `GET /analyses` | `?scope=all\|mine\|shared&search=&page=&limit=` | Returns summaries **with** `definition` (the list page draws layout thumbnails from `blocks`), plus `access: 'owner'\|'edit'\|'view'`, owner name/email, share count |
| `GET /analyses/:id` | — | 404 if deleted or no access |
| `POST /analyses` | `{ name, description, definition }` | needs `analysis.edit`; returns the created analysis |
| `PUT /analyses/:id` | `{ name, description, definition, rowVersion }` | owner or `EDIT` share; `409` if `rowVersion` is stale; returns new `rowVersion` |
| `DELETE /analyses/:id` | — | owner (or SUPER_ADMIN); soft delete |
| `POST /analyses/:id/duplicate` | `{ name? }` | anyone with view access + `analysis.edit`; copy owned by caller, no shares |
| `PUT /analyses/:id/shares` | `{ shares: [{ principalType, principalId, access }] }` | owner only; replaces the set |
| `GET /analysis/share-directory` | `?search=` | active users + roles for the share picker: `{ kind, id, label, sub }` |

Response object:
```json
{ "id": "42", "name": "…", "description": "…", "ownerEmail": "…", "ownerName": "…",
  "createdAt": "…", "updatedAt": "…", "rowVersion": 7, "access": "edit",
  "frame": "live", "compareTo": "12", "filters": [], "blocks": [],
  "shares": [{ "kind": "role", "id": "5", "label": "Statisticians", "access": "view" }] }
```
(`frame/compareTo/filters/blocks` spread from `DEFINITION`; ids as strings.)

**Autosave:** the builder saves on every edit. The frontend will debounce (~800 ms) and send `PUT` with `rowVersion`; keep the endpoint cheap (single UPDATE). Validate `DEFINITION` size (e.g. ≤ 256 KB) and JSON shape loosely (object with `blocks` array ≤ 60 items).

### 4.4 Export (Phase 3; Phase 1 can reuse `records`)

Today the frontend builds Excel/CSV in the browser, pulling full record extracts (≤ 200k rows) through its stub. With the real API that should be a streaming endpoint:

`POST /analysis/export` `{ query: Q, columns: string[], format: 'xlsx'|'csv', suppress: boolean }` → file stream, capped at 200,000 rows, `Content-Disposition` filename from the client. CSV text cells starting with `= + - @`, tab or CR must be prefixed with `'` (formula injection); the frontend already does this for its client-side CSV. Apply the §5.6 masking to exports exactly as to query responses. Aggregate/pivot block exports stay client-side (small).

---

## 5. Query implementation

### 5.1 Where the logic lives

Per the backend conventions (`SBR_BE` is execute-only; permissions checked in the DB), put SQL generation in a package **`SBR_APP.SBR_ANALYSIS_API`**:

- `RUN_AGGREGATE(p_user_id, p_request CLOB, p_rows OUT SYS_REFCURSOR, p_total OUT SYS_REFCURSOR)` — returns grouped rows with `KEY1, KEY2, N, V1..V4 [, MAXV1..MAXV4 for dominance]`.
- `RUN_RECORDS(p_user_id, p_request CLOB, p_total OUT NUMBER, p_rows OUT SYS_REFCURSOR)`.
- `RUN_COMPLETENESS(…)`, `RUN_FLOW(…)`.
- `LIST_FRAMES`, and the CRUD procedures (`LIST_ANALYSES`, `GET_ANALYSIS`, `SAVE_ANALYSIS`, `DELETE_ANALYSIS`, `SET_SHARES`, `GET_ACCESS`).

Node assembles the final JSON (merge compare rows, sort, apply top-N/Other if not done in SQL, disclosure flags). Porting `engine/query.ts` post-processing to the backend is the fastest safe path.

### 5.2 Injection safety

Mirror `SBR_QUERY_PKG`: identifiers **only** from a per-entity whitelist table/`CASE` (`field id → column`), never from the request; aggregate functions from a fixed map; values via **bind variables** (`DBMS_SQL` or `EXECUTE IMMEDIATE … USING`) rather than inlined literals. Unknown field/agg/op → `ORA-20410` → 400 (existing mapping).

### 5.3 SQL shapes

- **Aggregate:** `SELECT <k1>, <k2>, COUNT(*) N, <aggs> FROM <frame source> WHERE <filters> GROUP BY <k1>, <k2>`. Totals: same without `GROUP BY` (or `GROUPING SETS`). `MEDIAN(col)` for median; `MAX(col)` alongside `SUM(col)` for dominance.
- **Top-N + Other:** rank dimension-0 keys by count (`DENSE_RANK() OVER (ORDER BY COUNT(*) DESC)` in a CTE), then `CASE WHEN rnk <= :n THEN k1 ELSE '__other__' END` and re-group (or drop when `otherBucket=false`).
- **Compare:** run the aggregate twice (frames A and B) and merge on keys in Node, reusing the kept-keys set from the current frame.
- **`__frame` dimension (trends):** `UNION ALL` of the same aggregate over live + each COMPLETE snapshot, tagged with the frame id (≤ ~20 frames; cache — see §6).
- **Records:** `SELECT <columns> … ORDER BY <sort col> NULLS LAST, <id> OFFSET :o ROWS FETCH NEXT :n ROWS ONLY` + `COUNT(*)`.
- **Completeness:** `SUM(CASE WHEN col IS NOT NULL THEN 1 END)/COUNT(*)` per field (booleans: `= 'Y'`), grouped by `dimensions[0]` top-`limit` + overall.
- **Flow:** `FULL OUTER JOIN` of A and B on the entity id, each side carrying `in_all` (exists in frame) and `in_filtered` flags and the dimension value; classify rows with a `CASE` and aggregate `(from, to)` pairs.

**Existing SQL worth reusing:** `NPC_SBR/db/exploration/dashboard_data.sql` and `dashboard_isic_fix.sql` (DB-team aggregates over the same tables), `sbr_frame_integrity_check.sql` (validate a freshly frozen frame), `NPC_SBR/db/data/isic_lkp.csv` (source for the ISIC section column). The per-survey scripts under `NPC_SBR/db/sampling/` and `SBR_FREEZE_*` are sampling-specific — not a frame registry to extend.

### 5.4 Indexes

Snapshot tables: partitioned by `SNAPSHOT_ID` or composite-indexed on it (§3.4 item 2); add local bitmap or B-tree indexes on the heavy group-by columns if plans need them (`ISIC_SECTION, MUNICIPALITY, SIZE_CLASS, STATUS, SOURCE`). At ~115k rows per frame, full partition scans are fine — measure before indexing. Live views: ensure `SBR_ADDRESSES(SBR_ID, VALID_TO, PRIORITY)` and `SBR_CONTACTS(SBR_ID, VALID_TO)` indexes exist.

### 5.5 Performance targets

p95 < 1.5 s for aggregate/records on one frame; < 3 s for trend (`__frame`) and flow. A report fires one request per block (~5–10 in parallel) on load and on every cross-filter click, so these matter.

### 5.6 Disclosure control — must be enforced server-side

Constants (align with NPC policy — **currently min cell 3; the real-aggregates extract used 5 and dominance 0.5, so confirm**): `MIN_CELL = 3`, `DOMINANCE = 0.85`. Put them in config/env, not code.

- `flag = 'min'` when `0 < n < MIN_CELL`.
- `flag = 'dominance'` when a `sum` measure has `n > 1` and `MAX/SUM > DOMINANCE`.
- `flag = 'secondary'`: for 1-D results, and for each row and column line of 2-D results, if exactly one cell in a line is flagged, also flag the unflagged cell with the smallest `n`; repeat up to 4 passes (see `flagRows` in `engine/query.ts`).
- A cell is confidential if **either** frame is small: evaluate `n` and `prevN` (compare queries), otherwise the comparison-frame value leaks the cell.
- **Server enforcement is mandatory.** If the caller lacks `analysis.export_unsuppressed`, set `values` **and** `prev` of flagged rows to `null` before the response leaves the server — in `/analysis/query` and in every export. The frontend's "Published view" toggle is presentation only and must never be the protection. Totals stay published (secondary suppression is what protects them).
- Flow links with `value < MIN_CELL` are masked the same way.
- Records are unit-level data governed by the entity's normal view permissions (unchanged).

---

## 6. Caching, timeouts, rate limits

- **Cache** results keyed by `hash(request) + frame ids`. Snapshot-only requests are immutable → cache indefinitely (evict by LRU). Anything touching `live` → TTL ~5 min, cleared after a pipeline run / approval apply. In-process LRU is enough initially.
- **Timeout:** set `callTimeout` (node-oracledb) ≈ 20 s on the analysis connections; return 503 with a clear message on timeout.
- **Rate limit** `/analysis/query` per user (e.g. 120 req/min) — re-enable `express-rate-limit` for this router at least.
- Consider a dedicated small pool for analysis so ad-hoc queries can't starve the portal (`poolMax: 4` today).

---

## 7. Deliberately out of scope for v1

- **Column-level permissions:** none exist yet. When they land, add `GET /analysis/fields` returning the caller's allowed field ids per entity; the query package must reject disallowed fields (403) and the frontend will hide them in the field picker.
- Scheduled/emailed reports (no email server), natural-language queries (no LLM approval).
- Server-side PDF (the frontend prints the report itself).

---

## 8. Audit

The existing `SBR_AUDIT_LOG` is for register changes with an approval workflow; don't overload it. Add a light activity table:

```sql
CREATE TABLE SBR_ANALYSIS_ACTIVITY (
  ID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ANALYSIS_ID NUMBER,
  USER_ID     NUMBER NOT NULL,
  ACTION      VARCHAR2(30) NOT NULL,   -- CREATE, UPDATE_META, DELETE, SHARE, EXPORT, EXPORT_UNSUPPRESSED
  DETAIL      CLOB CHECK (DETAIL IS JSON),
  CREATED_AT  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);
```
Log creates, deletes, share changes and **every export** (with `suppress` flag and row count). Don't log every autosave `PUT` (rename/description changes only).

---

## 9. Frontend changes once the API exists (for reference)

- `features/analysis/api/analysisApi.ts`: `baseApi.injectEndpoints` with `getAnalysisFrames`, `runAnalysisQuery` (mutation-style `POST` used as a query via `builder.query({ query: (req) => ({ url: '/analysis/query', method: 'POST', body: req }) })`), analyses CRUD, shares, share directory; new tag `Analyses` in `services/api.ts`; mutations invalidate `['Analyses', 'AuditLog']`.
- Replace `useAnalysisResult` with the RTK hook; delete `mock/generate.ts`, `mock/frames.ts`, `mock/seedAnalyses.ts`, `engine/query.ts` (the client keeps only `engine/resolve.ts`).
- Replace the Redux/`localStorage` store with the CRUD endpoints; debounce autosave; handle `409` ("This analysis was changed elsewhere — reload").
- Permissions from `usePermission`; `canEdit` from the `access` field.
- Frames come from `GET /analysis/frames` (replacing `mock/frames.ts`); a saved analysis pointing at a frame that is no longer listed falls back to `live` with a notice.
- The Create/Browse Snapshot pages switch from their Redux stand-in to `SBR_SNAPSHOTS_API` (NPC-253), so a new snapshot appears in the Analysis frame picker immediately.

---

## 10. Open questions for the backend/DB owner

1. Disclosure thresholds — 3/0.85 (current) or 5/0.5 (real-aggregates extract)? Per-measure or global?
2. Which date defines `reg_year` (`REG_DATE`, `CR_ISSUE_DATE`, first `VALID_FROM`)?
3. Exact enterprise FDI column names (`foreign_ownership_pct`, `foreign_controlled`, `parent_country`).
4. Role shares: confirm "all assigned, non-expired roles" (§3.1) rather than only the active role.
5. NPC-253 additions (§3.4): accept SCN-consistent capture, partitioning, explicit columns, DB-level immutability, no hard delete / `ARCHIVED`, SELECT grants to `SBR_APP`?
6. Back-fill historic frames (§3.4 item 7)? If yes: which dates, and is reconstruction from SCD2 acceptable for enterprises/groups/contacts/addresses?
