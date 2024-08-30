/**
 * This repro illustrates a bug in duckdb-wasm v1.28.0 with nested describes
 * This appears to be fixed in some of the recent dev releases, including v1.28.1-dev258.0
 * Try changing the version in package.json to see the error
 */

const sql = `describe (describe select 1)`;

/* ===================================================================== */

const runWasm = async () => {
  const { dirname, resolve } = require("path");

  const {
    createDuckDB,
    ConsoleLogger,
    NODE_RUNTIME,
  } = require("@duckdb/duckdb-wasm/dist/duckdb-node-blocking");

  const DUCKDB_DIST = dirname(require.resolve("@duckdb/duckdb-wasm"));

  const DUCKDB_BUNDLES = {
    // mvp: {
    //   mainModule: resolve(DUCKDB_DIST, "./duckdb-mvp.wasm"),
    //   mainWorker: resolve(DUCKDB_DIST, "./duckdb-node-mvp.worker.cjs"),
    // },
    eh: {
      mainModule: resolve(DUCKDB_DIST, "./duckdb-eh.wasm"),
      mainWorker: resolve(DUCKDB_DIST, "./duckdb-node-eh.worker.cjs"),
    },
  };

  const db = await createDuckDB(
    DUCKDB_BUNDLES,
    new ConsoleLogger(),
    NODE_RUNTIME
  );

  await db.instantiate();

  db.open();

  const connection = db.connect();

  const table = connection.query(sql);
  const result = table.toArray();
  console.log(result[0].explain_value);
};

const run = async () => {
  const duckdb = require("duckdb");
  const db = new duckdb.Database(":memory:");

  db.all(sql, (error, result) => {
    if (error) {
      console.error("run failed");
      console.error(error);
    } else {
      console.log("run success");
      console.log(result[0].explain_value);
    }
  });
};

(async () => {
  console.clear();

  try {
    await runWasm();
    console.log("runWasm success");
  } catch (e) {
    console.log("runWasm failed");
    console.log(e);
  }

  console.log("\n\n========================\n\n");

  await run();
})();
