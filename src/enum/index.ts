export enum SetupStoreId {
  App = 'app-store',
  Theme = 'theme-store',
  Auth = 'auth-store',
  Route = 'route-store',
  Tab = 'tab-store',
  Notice = 'notice-store',
  Dict = 'dict-store',
  /** 库存数据「导入现有库存」异步任务（列表角标与轮询） */
  WmsExistingImportTask = 'wms-existing-import-task-store'
}
