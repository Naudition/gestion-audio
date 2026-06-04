declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: any[]): any;
    exec(sql: string, params?: any[]): any;
    export(): Uint8Array;
  }

  interface SqlJsStatic {
    new (data?: ArrayLike<number>): Database;
  }

  function initSqlJs(config?: any): Promise<{ Database: SqlJsStatic }>;

  export default initSqlJs;
  export { Database as Database };
}
