import assert from "node:assert/strict";
import { test } from "node:test";
import { BRANCH_HEADER, branchFromPath, scopedHeaders, resolveBranchId } from "./branch-scope";

test("branch scope follows each request URL, including separate tabs", () => {
  const incoming = new Headers({ [BRANCH_HEADER]: "forged" });
  assert.equal(
    scopedHeaders(incoming, "/admin/branches/one/invoices", "ADMIN").get(BRANCH_HEADER),
    "one"
  );
  assert.equal(
    scopedHeaders(incoming, "/admin/branches/two/memberships", "ADMIN").get(BRANCH_HEADER),
    "two"
  );
  assert.equal(scopedHeaders(incoming, "/app/invoices", "ADMIN").get(BRANCH_HEADER), null);
  assert.deepEqual(branchFromPath("/admin/branches/one/data/export"), {
    id: "one",
    path: "/app/data/export",
  });
  assert.equal(branchFromPath("/admin/branches"), null);
});

test("tenant and superadmin cannot obtain Admin branch scope", () => {
  const incoming = new Headers({ [BRANCH_HEADER]: "other" });
  for (const role of ["TENANT", "SUPERADMIN"]) {
    assert.equal(
      scopedHeaders(incoming, "/admin/branches/other/invoices", role).get(BRANCH_HEADER),
      null
    );
  }
  assert.equal(resolveBranchId("TENANT", "own", "other"), "own");
  assert.equal(resolveBranchId("TENANT", null, "other"), null);
  assert.equal(resolveBranchId("SUPERADMIN", null, "other"), null);
  assert.equal(resolveBranchId("ADMIN", "own", null), null);
  assert.equal(resolveBranchId("ADMIN", null, "selected"), "selected");
});
