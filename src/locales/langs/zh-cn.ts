const local: App.I18n.Schema = {
  system: {
    title: 'Forest管理系统',
    updateTitle: '系统版本更新通知',
    updateContent: '检测到系统有新版本发布，是否立即刷新页面？',
    updateConfirm: '立即刷新',
    updateCancel: '稍后再说'
  },
  common: {
    action: '操作',
    add: '新增',
    addSuccess: '添加成功',
    detail: '详情',
    backToHome: '返回首页',
    batchDelete: '批量删除',
    import: '导入',
    export: '导出',
    importSuccess: '导入成功',
    importFail: '导入失败',
    importTemplate: '导入模板',
    downloadTemplate: '下载模板',
    importResult: '导入结果',
    importSize: '请上传大小不超过',
    importEnd: '的文件',
    importFormat: '且格式为',
    importTip: '请上传大小不超过',
    exportSuccess: '导出成功',
    exportFail: '导出失败',
    updateExisting: '是否更新已经存在的数据',
    cancel: '取消',
    close: '关闭',
    check: '勾选',
    selectAll: '全选',
    expandColumn: '展开列',
    columnSetting: '列设置',
    config: '配置',
    login: '登录',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    deleteSuccess: '删除成功',
    confirmDelete: '确认删除吗？',
    edit: '编辑',
    download: '下载',
    preview: '预览',
    name: '名称',
    status: '状态',
    warning: '警告',
    error: '错误',
    failed: '操作失败',
    index: '序号',
    keywordSearch: '请输入关键词搜索',
    logout: '退出登录',
    logoutConfirm: '确认退出登录吗？',
    lookForward: '敬请期待',
    modify: '修改',
    modifySuccess: '修改成功',
    more: '更多',
    noData: '无数据',
    operate: '操作',
    pleaseCheckValue: '请检查输入的值是否合法',
    refresh: '刷新',
    reset: '重置',
    search: '搜索',
    switch: '切换',
    tip: '提示',
    trigger: '触发',
    update: '更新',
    saveSuccess: '保存成功',
    updateSuccess: '更新成功',
    noChange: '没有进行任何操作',
    userCenter: '个人中心',
    yesOrNo: {
      yes: '是',
      no: '否'
    },
    second: '秒',
    selected: '已选择',
    anyRecords: '条记录',
    clear: '清空',
    noSelectRecord: '未选中任何记录'
  },
  request: {
    logout: '请求失败后登出用户',
    logoutMsg: '用户状态失效，请重新登录',
    logoutWithModal: '请求失败后弹出模态框再登出用户',
    logoutWithModalMsg: '用户状态失效，请重新登录',
    refreshToken: '请求的token已过期，刷新token',
    tokenExpired: 'token已过期'
  },
  theme: {
    themeDrawerTitle: '主题配置',
    tabs: {
      appearance: '外观',
      layout: '布局',
      general: '通用',
      preset: '预设'
    },
    appearance: {
      themeSchema: {
        title: '主题模式',
        light: '亮色模式',
        dark: '暗黑模式',
        auto: '跟随系统'
      },
      grayscale: '灰色模式',
      colourWeakness: '色弱模式',
      themeColor: {
        title: '主题颜色',
        primary: '主色',
        info: '信息色',
        success: '成功色',
        warning: '警告色',
        error: '错误色',
        followPrimary: '跟随主色'
      },
      themeRadius: {
        title: '主题圆角'
      },
      recommendColor: '应用推荐算法的颜色',
      recommendColorDesc: '推荐颜色的算法参照',
      preset: {
        title: '主题预设',
        switchHint: '在下列预设中选择一项，点击右侧「应用」即可切换整套外观（含「银灰霓虹 3D」）。',
        apply: '应用',
        applySuccess: '预设应用成功',
        default: {
          name: '默认预设',
          desc: '系统默认主题预设'
        },
        soybean: {
          name: 'Soybean',
          desc: 'Soybean 默认主题预设'
        },
        dark: {
          name: '暗色预设',
          desc: '适用于夜间使用的暗色主题预设'
        },
        compact: {
          name: '紧凑型',
          desc: '适用于小屏幕的紧凑布局预设'
        },
        azir: {
          name: 'Azir的预设',
          desc: '是 Azir 比较喜欢的莫兰迪色系冷淡风'
        },
        silverNeon3d: {
          name: '银灰霓虹 3D',
          desc: '银灰渐变主背景、荧光点缀与浮雕立体感按钮/卡片'
        }
      }
    },
    layout: {
      layoutMode: {
        title: '布局模式',
        vertical: '左侧菜单模式',
        'vertical-mix': '左侧菜单混合模式',
        'vertical-hybrid-header-first': '左侧混合-顶部优先',
        horizontal: '顶部菜单模式',
        'top-hybrid-sidebar-first': '顶部混合-侧边优先',
        'top-hybrid-header-first': '顶部混合-顶部优先',
        vertical_detail: '左侧菜单布局，菜单在左，内容在右。',
        'vertical-mix_detail': '左侧双菜单布局，一级菜单在左侧深色区域，二级菜单在左侧浅色区域。',
        'vertical-hybrid-header-first_detail':
          '左侧混合布局，一级菜单在顶部，二级菜单在左侧深色区域，三级菜单在左侧浅色区域。',
        horizontal_detail: '顶部菜单布局，菜单在顶部，内容在下方。',
        'top-hybrid-sidebar-first_detail': '顶部混合布局，一级菜单在左侧，二级菜单在顶部。',
        'top-hybrid-header-first_detail': '顶部混合布局，一级菜单在顶部，二级菜单在左侧。'
      },
      tab: {
        title: '标签栏设置',
        visible: '显示标签栏',
        cache: '标签栏信息缓存',
        cacheTip: '离开页面后仍然保留标签栏信息',
        height: '标签栏高度',
        mode: {
          title: '标签栏风格',
          slider: '滑块风格',
          chrome: '谷歌风格',
          button: '按钮风格'
        },
        closeByMiddleClick: '鼠标中键关闭标签页',
        closeByMiddleClickTip: '启用后可以使用鼠标中键点击标签页进行关闭'
      },
      header: {
        title: '头部设置',
        height: '头部高度',
        breadcrumb: {
          visible: '显示面包屑',
          showIcon: '显示面包屑图标'
        }
      },
      sider: {
        title: '侧边栏设置',
        inverted: '深色侧边栏',
        width: '侧边栏宽度',
        collapsedWidth: '侧边栏折叠宽度',
        mixWidth: '混合布局侧边栏宽度',
        mixCollapsedWidth: '混合布局侧边栏折叠宽度',
        mixChildMenuWidth: '混合布局子菜单宽度',
        autoSelectFirstMenu: '自动选择第一个子菜单',
        autoSelectFirstMenuTip: '点击一级菜单时，自动选择并导航到第一个子菜单的最深层级'
      },
      footer: {
        title: '底部设置',
        visible: '显示底部',
        fixed: '固定底部',
        height: '底部高度',
        right: '底部居右'
      },
      content: {
        title: '内容区域设置',
        scrollMode: {
          title: '滚动模式',
          tip: '主题滚动仅 main 部分滚动，外层滚动可携带头部底部一起滚动',
          wrapper: '外层滚动',
          content: '主体滚动'
        },
        page: {
          animate: '页面切换动画',
          mode: {
            title: '页面切换动画类型',
            'fade-slide': '滑动',
            fade: '淡入淡出',
            'fade-bottom': '底部消退',
            'fade-scale': '缩放消退',
            'zoom-fade': '渐变',
            'zoom-out': '闪现',
            none: '无'
          }
        },
        fixedHeaderAndTab: '固定头部和标签栏'
      }
    },
    general: {
      title: '通用设置',
      watermark: {
        title: '水印设置',
        visible: '显示全屏水印',
        text: '自定义水印文本',
        enableUserName: '启用用户名水印',
        enableTime: '显示当前时间',
        timeFormat: '时间格式'
      },
      multilingual: {
        title: '多语言设置',
        visible: '显示多语言按钮'
      },
      globalSearch: {
        title: '全局搜索设置',
        visible: '显示全局搜索按钮'
      }
    },
    configOperation: {
      copyConfig: '复制配置',
      copySuccessMsg: '复制成功，请替换 src/theme/settings.ts 中的变量 themeSettings',
      resetConfig: '重置配置',
      resetSuccessMsg: '重置成功'
    },
    tablePropsTitle: '表格配置',
    table: {
      size: {
        title: '表格大小',
        small: '小',
        medium: '中',
        large: '大'
      },
      bordered: '边框',
      bottomBordered: '底部边框',
      singleColumn: '设定行的分割线',
      singleLine: '设定列的分割线',
      striped: '斑马线条纹'
    }
  },
  route: {
    login: '登录',
    403: '无权限',
    404: '页面不存在',
    500: '服务器错误',
    'iframe-page': '外链页面',
    home: '首页',
    system: '系统管理',
    system_user: '用户管理',
    system_role: '角色管理',
    system_menu: '菜单管理',
    system_dept: '部门管理',
    system_post: '岗位管理',
    system_dict: '字典管理',
    system_config: '参数设置',
    system_notice: '通知公告',
    system_oss: '文件管理',
    'system_oss-config': 'OSS 配置',
    system_client: '客户端管理',
    system_tenant: '租户管理',
    'system_tenant-package': '租户套餐',
    monitor: '系统监控',
    monitor_cache: '缓存监控',
    monitor_logininfor: '登录日志',
    monitor_operlog: '操作日志',
    monitor_online: '在线用户',
    'social-callback': '单点登录回调',
    'driver-check-in': '司机到仓登记',
    'user-center': '个人中心',
    demo: '测试',
    demo_demo: '测试单表',
    demo_tree: '测试树表',
    exception: '异常页',
    exception_403: '403',
    exception_404: '404',
    exception_500: '500',
    tool: '系统工具',
    tool_gen: '代码生成',
    wms: 'WMS 仓库管理',
    'wms_devanning-order': '拆柜订单',
    wms_inventory: '库存管理',
    'wms_inventory_warehouse-area': '库区管理',
    wms_inventory_location: '库位管理',
    wms_warehouse: '仓库',
    wms_warehouse_settings: '仓库设置',
    wms_warehouse_settings_location: '库位',
    'wms_warehouse_settings_warehouse-area': '库区',
    'wms_warehouse_settings_putaway-config': '上架配置',
    'wms_warehouse_settings_prelocation-exception-log': '预分配异常日志',
    wms_order: '订单管理',
    'wms_order_devanning-order': '拆柜订单',
    'wms_order_driver-check-in-record': 'Check-in 记录',
    'wms_order_park-scheduling': '园区调度',
    'wms_order_park-management': '园区管理',
    'wms_order_cargo-inbound-plan': '货物订单',
    'wms_order_import-inventory': '库存列表',
    'wms_order_warehouse-inventory-map': '库存平面图',
    'wms_order_inventory-data': '库存数据',
    'wms_order_inventory-data-dashboard': '库存与出库看板',
    'wms_order_outstock-data': '出库数据',
    'wms_order_outstock-exception': '出库异常数据',
    about: '关于',
    basic: '基础数据',
    'basic_platform-warehouse': '平台仓库管理'
  },
  menu: {
    system_tenant: '租户管理',
    system_log: '日志管理',
    'monitor_snail-job': '任务调度中心',
    monitor_admin: 'Admin 监控'
  },
  dict: {
    sys_user_sex: {
      male: '男',
      female: '女',
      unknown: '未知'
    },
    sys_show_hide: {
      show: '显示',
      hide: '隐藏'
    },
    sys_normal_disable: {
      normal: '正常',
      disable: '停用'
    },
    sys_yes_no: {
      yes: '是',
      no: '否'
    },
    sys_notice_type: {
      notice: '通知',
      announcement: '公告'
    },
    sys_notice_status: {
      normal: '正常',
      close: '关闭'
    },
    sys_oper_type: {
      insert: '新增',
      update: '修改',
      delete: '删除',
      grant: '授权',
      export: '导出',
      import: '导入',
      force: '强退',
      gencode: '生成代码',
      clean: '清空数据',
      other: '其他'
    },
    sys_common_status: {
      success: '成功',
      fail: '失败'
    },
    sys_grant_type: {
      password: '密码认证',
      sms: '短信认证',
      email: '邮件认证',
      miniapp: '小程序认证',
      social: '三方登录认证'
    },
    sys_device_type: {
      pc: 'PC',
      android: '安卓',
      ios: 'iOS',
      miniapp: '小程序'
    },
    wf_business_status: {
      revoked: '已撤销',
      draft: '草稿',
      pending: '待审核',
      completed: '已完成',
      cancelled: '已作废',
      returned: '已退回',
      terminated: '已终止'
    },
    wf_form_type: {
      custom_form: '自定义表单',
      dynamic_form: '动态表单'
    },
    wf_task_status: {
      revoke: '撤销',
      pass: '通过',
      pending_review: '待审核',
      cancel: '作废',
      return: '退回',
      terminate: '终止',
      transfer: '转办',
      delegate: '委托',
      copy: '抄送',
      add_sign: '加签',
      minus_sign: '减签',
      timeout: '超时'
    }
  },
  page: {
    login: {
      common: {
        title: '现代化的企业级多租户管理系统',
        subTitle: '',
        loginOrRegister: '登录 / 注册',
        register: '注册',
        userNamePlaceholder: '请输入用户名',
        phonePlaceholder: '请输入手机号',
        codePlaceholder: '请输入验证码',
        passwordPlaceholder: '请输入密码',
        confirmPasswordPlaceholder: '请再次输入密码',
        codeLogin: '验证码登录',
        confirm: '确定',
        back: '返回',
        validateSuccess: '验证成功',
        loginSuccess: '登录成功',
        welcomeBack: '欢迎回来，{userName} ！'
      },
      pwdLogin: {
        title: '密码登录',
        rememberMe: '记住密码',
        forgetPassword: '忘记密码？',
        register: '注册账号',
        otherAccountLogin: '其他账号登录',
        otherLoginMode: '其他登录方式',
        superAdmin: '超级管理员',
        admin: '管理员',
        user: '普通用户'
      },
      codeLogin: {
        title: '验证码登录',
        getCode: '获取验证码',
        reGetCode: '{time}秒后重新获取',
        sendCodeSuccess: '验证码发送成功',
        imageCodePlaceholder: '请输入图片验证码'
      },
      register: {
        title: '注册账号',
        agreement: '我已经仔细阅读并接受',
        protocol: '《用户协议》',
        policy: '《隐私权政策》'
      },
      resetPwd: {
        title: '重置密码'
      },
      bindWeChat: {
        title: '绑定微信'
      }
    },
    home: {
      branchDesc:
        '为了方便大家开发和更新合并，我们对main分支的代码进行了精简，只保留了首页菜单，其余内容已移至example分支进行维护。预览地址显示的内容即为example分支的内容。',
      greeting: '早安，{userName}, 今天又是充满活力的一天!',
      weatherDesc: '今日多云转晴，20℃ - 25℃!',
      remainDevanningTasks: '剩余拆柜任务',
      inventoryOccupancy: '库存占用率',
      estimatedLoading: '预计装车',
      estimatedPickup: '预计提柜',
      inboundQty: '入库数量',
      outboundQty: '出库数量',
      pieSeriesTitle: '业务结构',
      pieAmazon: '亚马逊',
      pieBen: '本',
      pieDaniuWarehouse: '大牛仓',
      pieTransferOrder: '中转订单',
      todo: '待办',
      message: '消息',
      downloadCount: '下载量',
      registerCount: '注册量',
      schedule: '作息安排',
      study: '学习',
      work: '工作',
      rest: '休息',
      entertainment: '娱乐',
      visitCount: '访问量',
      turnover: '成交额',
      dealCount: '成交量',
      projectNews: {
        title: '项目动态',
        moreNews: '更多动态',
        desc1: 'Soybean 在2021年5月28日创建了开源项目 soybean-admin!',
        desc2: 'Yanbowe 向 soybean-admin 提交了一个bug，多标签栏不会自适应。',
        desc3: 'Soybean 准备为 soybean-admin 的发布做充分的准备工作!',
        desc4: 'Soybean 正在忙于为soybean-admin写项目说明文档！',
        desc5: 'Soybean 刚才把工作台页面随便写了一些，凑合能看了！'
      },
      creativity: '创意'
    },
    common: {
      id: 'ID',
      createBy: '创建者',
      createTime: '创建时间',
      updateBy: '更新者',
      updateTime: '更新时间',
      remark: '备注',
      form: {
        remark: {
          required: '请输入备注',
          invalid: '备注不能为空'
        }
      }
    },
    system: {
      client: {
        title: '客户端列表',
        clientId: '客户端 ID',
        clientKey: '客户端 Key',
        clientSecret: '客户端秘钥',
        grantTypeList: '授权类型',
        deviceType: '设备类型',
        activeTimeout: 'Token 活跃超时时间',
        timeout: 'Token 固定超时',
        status: '状态',
        form: {
          clientId: {
            required: '请输入客户端 ID',
            invalid: '客户端 ID 不能为空'
          },
          clientKey: {
            required: '请输入客户端 Key',
            invalid: '客户端 Key 不能为空'
          },
          clientSecret: {
            required: '请输入客户端秘钥',
            invalid: '客户端秘钥不能为空'
          },
          grantTypeList: {
            required: '请选择授权类型',
            invalid: '授权类型不能为空'
          },
          deviceType: {
            required: '请选择设备类型',
            invalid: '设备类型不能为空'
          },
          activeTimeout: {
            required: '请输入 Token 活跃超时时间',
            invalid: 'Token 活跃超时时间不能为空',
            tooltip: '指定时间无操作则过期(单位：秒), 默认30分钟(1800秒)'
          },
          timeout: {
            required: '请输入 Token 固定超时',
            invalid: 'Token 固定超时不能为空',
            tooltip: '指定时间必定过期(单位：秒)，默认七天(604800秒)'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          }
        },
        addClient: '新增客户端',
        editClient: '编辑客户端'
      },
      config: {
        title: '参数配置列表',
        configName: '参数名称',
        configKey: '参数键名',
        configValue: '参数键值',
        configType: '是否内置',
        remark: '备注',
        createTime: '创建时间',
        refreshCache: '刷新缓存',
        refreshCacheSuccess: '刷新缓存成功',
        form: {
          configId: {
            required: '请输入参数主键',
            invalid: '参数主键不能为空'
          },
          configName: {
            required: '请输入参数名称',
            invalid: '参数名称不能为空'
          },
          configKey: {
            required: '请输入参数键名',
            invalid: '参数键名不能为空'
          },
          configValue: {
            required: '请输入参数键值',
            invalid: '参数键值不能为空'
          },
          configType: {
            required: '请选择是否内置',
            invalid: '是否内置不能为空'
          },
          remark: {
            required: '请输入备注',
            invalid: '备注不能为空'
          }
        },
        addConfig: '新增参数配置',
        editConfig: '编辑参数配置'
      },
      dept: {
        empty: '暂无部门信息',
        title: '部门列表',
        parentId: '上级部门',
        deptName: '部门名称',
        orderNum: '排序',
        deptCategory: '类别编码',
        leader: '负责人',
        phone: '联系电话',
        email: '邮箱',
        status: '状态',
        sort: '排序',
        createTime: '创建时间',
        expandAll: '全部展开',
        collapseAll: '全部收起',
        form: {
          parentId: {
            required: '请选择上级部门',
            invalid: '上级部门不能为空'
          },
          deptName: {
            required: '请输入部门名称',
            invalid: '部门名称不能为空'
          },
          orderNum: {
            required: '请输入排序',
            invalid: '排序不能为空'
          },
          deptCategory: {
            required: '请输入类别编码',
            invalid: '类别编码不能为空'
          },
          leader: {
            required: '请输入负责人',
            invalid: '负责人不能为空'
          },
          phone: {
            required: '请输入联系电话',
            invalid: '联系电话不能为空'
          },
          email: {
            required: '请输入邮箱',
            invalid: '邮箱不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          },
          sort: {
            required: '请输入排序',
            invalid: '排序不能为空'
          },
          deptId: {
            required: '请输入部门id',
            invalid: '部门id不能为空'
          }
        },
        error: {
          getDeptDataFail: '获取部门用户数据失败',
          getDeptUserDataFail: '获取部门用户数据失败'
        },
        placeholder: {
          defaultLeaderPlaceHolder: '请选择负责人',
          addDataLeaderPlaceHolder: '仅在更新时可选择部门负责人',
          deptUserIsEmptyLeaderPlaceHolder: '该部门没有负责人'
        },
        addDept: '新增部门',
        editDept: '编辑部门'
      },
      dict: {
        title: '字典列表',
        dictTypeTitle: '字典类型列表',
        dictName: '字典名称',
        dictType: '字典类型',
        status: '状态',
        remark: '备注',
        createTime: '创建时间',
        refreshCacheSuccess: '刷新缓存成功',
        refreshCache: '刷新缓存',
        confirmDeleteDictType: '确定删除字典类型',
        data: {
          title: '字典数据列表',
          label: '字典标签',
          value: '字典键值',
          dictSort: '字典排序',
          isDefault: '是否默认',
          listClass: '标签样式',
          cssClass: 'CSS样式',
          status: '状态',
          remark: '备注',
          createTime: '创建时间'
        },
        form: {
          dictId: {
            required: '请输入字典主键',
            invalid: '字典主键不能为空'
          },
          dictCode: {
            required: '请输入字典编码',
            invalid: '字典编码不能为空'
          },
          dictName: {
            required: '请输入字典名称',
            invalid: '字典名称不能为空'
          },
          dictType: {
            required: '请输入字典类型',
            invalid: '字典类型不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          },
          remark: {
            required: '请输入备注',
            invalid: '备注不能为空'
          },
          dictLabel: {
            required: '请输入字典标签',
            invalid: '字典标签不能为空'
          },
          dictValue: {
            required: '请输入字典键值',
            invalid: '字典键值不能为空'
          },
          dictSort: {
            required: '请输入字典排序',
            invalid: '字典排序不能为空'
          },
          isDefault: {
            required: '请选择是否默认',
            invalid: '是否默认不能为空'
          },
          listClass: {
            required: '请选择回显样式',
            invalid: '回显样式不能为空'
          },
          cssClass: {
            required: '请输入样式属性（其他样式扩展）',
            invalid: 'CSS样式不能为空'
          }
        },
        addDict: '新增字典',
        editDict: '编辑字典',
        addDictData: '新增字典数据',
        editDictData: '编辑字典数据',
        addDictType: '新增字典类型',
        editDictType: '编辑字典类型',
        exportDictType: '导出字典类型',
        refreshDictType: '刷新列表',
        dictTypeIsEmpty: '暂无字典类型'
      },
      menu: {
        title: '菜单列表',
        parentId: '上级菜单',
        iconType: '图标类型',
        menuName: '菜单名称',
        icon: '菜单图标',
        orderNum: '排序',
        perms: '权限字符',
        component: '组件路径',
        path: '路由地址',
        layout: '布局方式',
        externalPath: '外链地址',
        query: '路由参数',
        iframeQuery: 'iframe 地址',
        isFrame: '是否外链',
        isCache: '是否缓存',
        menuType: '菜单类型',
        visible: '显示状态',
        status: '菜单状态',
        createTime: '创建时间',
        cache: '缓存',
        noCache: '不缓存',
        rootName: '根目录',
        buttonPermissionList: '按钮权限列表',
        emptyMenu: '暂无菜单',
        menuDetail: '菜单详情',
        cascadeDeleteContent: '级联删除菜单将删除所选中的菜单，是否继续？',
        iconifyTip: 'iconify 地址：https://icones.js.org',
        isFrameTip: '选择是外链则路由地址需要以`http(s)://`开头',
        isCacheTip: '选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致',
        visibleTip: '选择隐藏则路由将不会出现在侧边栏，但仍然可以访问',
        statusTip: '选择停用则路由将不会出现在侧边栏，也不能被访问',
        permsTip: "控制器中定义的权限字符，如：`{'@'}SaCheckPermission('system:user:list')`",
        componentTip: '访问的组件路径，如：`system/user/index`，默认在`views`目录下',
        pathTip: '访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头',
        layoutTip: '默认布局：具有公共部分的布局，如全局头部、侧边栏、底部等\n空白布局：无公共部分的布局，如登录页',
        form: {
          parentId: {
            required: '请选择上级菜单',
            invalid: '上级菜单不能为空'
          },
          menuType: {
            required: '请选择菜单类型',
            invalid: '菜单类型不能为空'
          },
          menuIds: {
            required: '请选择菜单',
            invalid: '菜单不能为空'
          },
          icon: {
            required: '请选择菜单图标',
            invalid: '菜单图标不能为空'
          },
          menuName: {
            required: '请输入菜单名称',
            invalid: '菜单名称不能为空'
          },
          orderNum: {
            required: '请输入排序',
            invalid: '排序不能为空'
          },
          perms: {
            required: '请输入权限字符',
            invalid: '权限字符不能为空'
          },
          isFrame: {
            required: '请选择是否外链',
            invalid: '是否外链不能为空'
          },
          path: {
            required: '请输入路由地址',
            invalid: '路由地址不能为空'
          },
          component: {
            required: '请输入组件路径',
            invalid: '组件路径不能为空'
          },
          query: {
            required: '请输入路由参数',
            invalid: '路由参数不能为空'
          },
          isCache: {
            required: '请选择是否缓存',
            invalid: '是否缓存不能为空'
          },
          visible: {
            required: '请选择显示状态',
            invalid: '显示状态不能为空'
          },
          status: {
            required: '请选择菜单状态',
            invalid: '菜单状态不能为空'
          },
          permission: {
            required: '请输入权限标识',
            invalid: '权限标识不能为空'
          }
        },
        placeholder: {
          iconifyIconPlaceholder: '请输入图标',
          localIconPlaceholder: '请选择本地图标',
          queryKey: '请输入 Key',
          queryValue: '请输入 Value',
          queryIframe: '请输入 iframe 地址'
        },
        directory: '目录',
        menu: '菜单',
        button: '按钮',
        addMenu: '新增菜单',
        addChildMenu: '新增子菜单',
        editMenu: '编辑菜单',
        cascadeDelete: '级联删除菜单'
      },
      notice: {
        title: '通知公告列表',
        noticeTitle: '公告标题',
        noticeType: '公告类型',
        noticeContent: '公告内容',
        status: '状态',
        createTime: '创建时间',
        form: {
          noticeTitle: {
            required: '请输入公告标题',
            invalid: '公告标题不能为空'
          },
          noticeType: {
            required: '请选择公告类型',
            invalid: '公告类型不能为空'
          },
          noticeContent: {
            required: '请输入公告内容',
            invalid: '公告内容不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          }
        },
        addNotice: '新增公告',
        editNotice: '编辑公告'
      },
      oss: {
        title: '文件列表',
        fileName: '文件名称',
        originalName: '原始名称',
        fileSuffix: '文件后缀',
        url: '文件地址',
        createTime: '创建时间',
        service: '服务商',
        form: {
          file: {
            required: '请选择文件',
            invalid: '文件不能为空'
          }
        },
        upload: '上传文件',
        preview: '预览',
        download: '下载',
        copy: '复制链接',
        copySuccess: '复制成功'
      },
      ossConfig: {
        title: 'OSS配置列表',
        configKey: '配置键',
        accessKey: 'accessKey',
        secretKey: 'secretKey',
        bucketName: '桶名称',
        prefix: '前缀',
        endpoint: '域名',
        domain: '自定义域名',
        isHttps: '是否https',
        region: '地域',
        status: '状态',
        remark: '备注',
        createTime: '创建时间',
        form: {
          configKey: {
            required: '请输入配置键',
            invalid: '配置键不能为空'
          },
          accessKey: {
            required: '请输入accessKey',
            invalid: 'accessKey不能为空'
          },
          secretKey: {
            required: '请输入secretKey',
            invalid: 'secretKey不能为空'
          },
          bucketName: {
            required: '请输入桶名称',
            invalid: '桶名称不能为空'
          },
          prefix: {
            required: '请输入前缀',
            invalid: '前缀不能为空'
          },
          endpoint: {
            required: '请输入域名',
            invalid: '域名不能为空'
          },
          domain: {
            required: '请输入自定义域名',
            invalid: '自定义域名不能为空'
          },
          isHttps: {
            required: '请选择是否https',
            invalid: '是否https不能为空'
          },
          region: {
            required: '请输入地域',
            invalid: '地域不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          },
          remark: {
            required: '请输入备注',
            invalid: '备注不能为空'
          }
        },
        addOssConfig: '新增OSS配置',
        editOssConfig: '编辑OSS配置'
      },
      post: {
        title: '岗位列表',
        postCode: '岗位编码',
        postName: '岗位名称',
        postSort: '岗位排序',
        status: '状态',
        remark: '备注',
        createTime: '创建时间',
        form: {
          postCode: {
            required: '请输入岗位编码',
            invalid: '岗位编码不能为空'
          },
          postName: {
            required: '请输入岗位名称',
            invalid: '岗位名称不能为空'
          },
          postSort: {
            required: '请输入岗位排序',
            invalid: '岗位排序不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          },
          remark: {
            required: '请输入备注',
            invalid: '备注不能为空'
          }
        },
        addPost: '新增岗位',
        editPost: '编辑岗位'
      },
      role: {
        title: '角色列表',
        roleName: '角色名称',
        roleKey: '权限字符',
        roleSort: '角色排序',
        status: '状态',
        remark: '备注',
        menuPermission: '菜单权限',
        dataScope: '数据权限',
        createTime: '创建时间',
        form: {
          roleName: {
            required: '请输入角色名称',
            invalid: '角色名称不能为空'
          },
          roleKey: {
            required: '请输入权限字符',
            invalid: '权限字符不能为空'
          },
          roleSort: {
            required: '请输入角色排序',
            invalid: '角色排序不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          },
          remark: {
            required: '请输入备注',
            invalid: '备注不能为空'
          },
          menuIds: {
            required: '请选择菜单权限',
            invalid: '菜单权限不能为空'
          },
          deptIds: {
            required: '请选择部门权限',
            invalid: '部门权限不能为空'
          }
        },
        addRole: '新增角色',
        editRole: '编辑角色',
        configPermission: '分配权限',
        authorizedUsers: '分配用户',
        selectMenuPermission: '选择菜单权限',
        selectDataScope: '选择数据权限',
        selectDeptPermission: '选择部门权限'
      },
      tenant: {
        title: '租户列表',
        tenantName: '租户名称',
        tenantId: '租户编号',
        contactUserName: '联系人',
        contactPhone: '联系电话',
        companyName: '公司名称',
        licenseNumber: '营业执照编号',
        address: '地址',
        intro: '企业简介',
        domain: '域名',
        packageId: '租户套餐',
        expireTime: '过期时间',
        accountCount: '账号数量',
        status: '状态',
        createTime: '创建时间',
        form: {
          tenantName: {
            required: '请输入租户名称',
            invalid: '租户名称不能为空'
          },
          contactUserName: {
            required: '请输入联系人',
            invalid: '联系人不能为空'
          },
          contactPhone: {
            required: '请输入联系电话',
            invalid: '联系电话不能为空'
          },
          companyName: {
            required: '请输入公司名称',
            invalid: '公司名称不能为空'
          },
          licenseNumber: {
            required: '请输入营业执照编号',
            invalid: '营业执照编号不能为空'
          },
          address: {
            required: '请输入地址',
            invalid: '地址不能为空'
          },
          intro: {
            required: '请输入企业简介',
            invalid: '企业简介不能为空'
          },
          domain: {
            required: '请输入域名',
            invalid: '域名不能为空'
          },
          packageId: {
            required: '请选择租户套餐',
            invalid: '租户套餐不能为空'
          },
          expireTime: {
            required: '请选择过期时间',
            invalid: '过期时间不能为空'
          },
          accountCount: {
            required: '请输入账号数量',
            invalid: '账号数量不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          }
        },
        addTenant: '新增租户',
        editTenant: '编辑租户'
      },
      tenantPackage: {
        title: '租户套餐列表',
        packageName: '套餐名称',
        menuIds: '菜单权限',
        remark: '备注',
        status: '状态',
        createTime: '创建时间',
        form: {
          packageName: {
            required: '请输入套餐名称',
            invalid: '套餐名称不能为空'
          },
          menuIds: {
            required: '请选择菜单权限',
            invalid: '菜单权限不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          },
          remark: {
            required: '请输入备注',
            invalid: '备注不能为空'
          }
        },
        addTenantPackage: '新增租户套餐',
        editTenantPackage: '编辑租户套餐',
        statusChangeSuccess: '状态修改成功'
      },
      user: {
        title: '用户列表',
        userName: '用户名称',
        nickName: '用户昵称',
        deptName: '部门',
        phonenumber: '手机号码',
        status: '状态',
        createTime: '创建时间',
        password: '密码',
        confirmPassword: '确认密码',
        sex: '性别',
        roleIds: '角色',
        postIds: '岗位',
        email: '邮箱',
        avatar: '头像',
        remark: '备注',
        form: {
          userName: {
            required: '请输入用户名称',
            invalid: '用户名称不能为空'
          },
          nickName: {
            required: '请输入用户昵称',
            invalid: '用户昵称不能为空'
          },
          deptId: {
            required: '请选择部门',
            invalid: '部门不能为空'
          },
          phonenumber: {
            required: '请输入手机号码',
            invalid: '手机号码不能为空'
          },
          status: {
            required: '请选择状态',
            invalid: '状态不能为空'
          },
          password: {
            required: '请输入密码',
            invalid: '密码不能为空'
          },
          confirmPassword: {
            required: '请输入确认密码',
            invalid: '确认密码不能为空'
          },
          sex: {
            required: '请选择性别',
            invalid: '性别不能为空'
          },
          roleIds: {
            required: '请选择角色',
            invalid: '角色不能为空'
          },
          postIds: {
            required: '请选择岗位',
            invalid: '岗位不能为空'
          },
          email: {
            required: '请输入邮箱',
            invalid: '邮箱不能为空'
          },
          remark: {
            required: '请输入备注',
            invalid: '备注不能为空'
          }
        },
        addUser: '新增用户',
        editUser: '编辑用户',
        resetPassword: '重置密码',
        importUsers: '导入用户',
        exportTemplate: '导出模板',
        importSuccess: '导入成功',
        statusChangeSuccess: '状态修改成功'
      }
    },
    basic: {
      platformWarehouse: {
        title: '平台仓库管理',
        addPlatform: '新增平台',
        addWarehouse: '新增仓库',
        platformList: '平台列表',
        platformSearchPlaceholder: '搜索平台名称或代码',
        platformSearchEmpty: '无匹配平台，请调整关键词或清空搜索',
        belongPlatformPlaceholder: '请选择所属平台',
        platformName: '平台名称',
        platformCode: '平台代码',
        platformIcon: '平台图标',
        iconUploadHint: 'PNG/JPG，建议 100×100',
        iconUrlPlaceholder: '或直接填写图标 URL',
        status: '状态',
        enabled: '启用',
        disabled: '停用',
        remark: '备注',
        belongPlatform: '所属平台',
        warehouseName: '仓库名称',
        warehouseCodeCol: '仓库代码',
        warehouseCodeHint: '如 AMZ-US-01',
        country: '国家/地区',
        stateProvince: '州/省',
        city: '城市',
        addressLine: '详细地址',
        addressCol: '详细地址',
        postalCode: '邮编',
        palletCbm: '单托CBM',
        palletCbmPlaceholder: '可选，立方米/托',
        createTime: '创建时间',
        searchPlaceholder: '仓库代码/名称',
        statusFilter: '状态',
        statusAll: '全部',
        countryFilter: '国家/地区',
        export: '导出',
        batchEnable: '批量启用',
        batchDisable: '批量停用',
        disable: '停用',
        enable: '启用',
        editPlatform: '编辑平台',
        editWarehouse: '编辑仓库',
        warehouseDetail: '仓库详情',
        operateLog: '操作记录',
        noOperateLog: '暂无操作记录',
        disablePlatformWarn: '该平台下有 {count} 个启用仓库，停用平台将同步停用所有仓库，是否继续？',
        disableWarehouseConfirm: '确认停用仓库 {code}？',
        enableWarehouseConfirm: '确认启用仓库 {code}？',
        clickToCopy: '点击复制代码',
        copied: '已复制',
        copyFail: '复制失败',
        rule: {
          platformId: '请选择所属平台',
          platformName: '请输入平台名称',
          platformNameMax: '最多 30 个字符',
          platformCode: '请输入平台代码',
          platformCodePattern: '3～10 位大写字母与数字',
          warehouseName: '请输入仓库名称',
          warehouseNameMax: '最多 100 个字符',
          warehouseCode: '请输入仓库代码',
          warehouseCodePattern: '1～20 位大写字母、数字、连字符',
          country: '请选择国家/地区',
          addressLine: '请输入详细地址',
          addressLineMax: '最多 200 个字符'
        },
        importWarehouse: '导入仓库',
        importSingleFileHint: '请上传一个 Excel（.xls / .xlsx），每行一条仓库数据。',
        importParsePreview: '解析并预览',
        importConfirmSubmit: '确认导入',
        importBackToFiles: '上一步',
        importPreviewTitle: '导入预览（共 {count} 行）',
        importPreviewHint:
          '请核对解析结果。确认后仅写入无校验错误的行；错误行将跳过（具体以后端策略为准）。',
        importPreviewErrorSummary: '其中 {error} 行有错误，可提交 {valid} 行。',
        importNeedFile: '请先选择 Excel 文件',
        importPreviewEmpty: '未解析到数据，请检查文件或表头是否与模板一致',
        importNoValidRows: '没有可导入的有效行，请修正 Excel 后再试',
        importExcelColumnsTitle: 'Excel 列与系统字段（表头建议与模板一致）',
        importExcelColumnsBody: `第 1 列 平台代码 → platformCode（须与系统中已存在平台一致）
第 2 列 仓库代码 → warehouseCode（同时也是仓库名称；落库时 warehouseName = warehouseCode）
第 3 列 国家/地区 → countryCode（ISO 3166-1 alpha-2，如 US、CN）
第 4 列 详细地址 → addressLine
第 5 列 城市 → city（可空）
第 6 列 州/省 → stateProvince（可空）
第 7 列 邮编 → postalCode（可空）
第 8 列 单托CBM → palletCbm（可空；立方米/托）`,
        importColRowNum: '行号',
        importColError: '校验说明'
      }
    },
    wms: {
      devanningOrder: {
        title: '拆柜订单',
        createTimeRange: '创建时间',
        orderTimeRange: '下单时间',
        devanningCompleteTimeRange: '拆柜完成时间',
        expectedDevanningTimeRange: '预计拆柜时间',
        devanningRound: '拆柜轮次',
        round1: '第一轮',
        round2: '第二轮',
        round3: '第三轮',
        importOrder: '导入订单',
        importOrderTooltip: '请使用 V2 模板（下载模板）；仅读第二个工作表，预览走 import-preview/v2；表头含 Carrier、Remark 等与标准派送扩展列，具体以后端为准。',
        importDispatchStandard: '导入派送表（标准）',
        importRawOrder: '导入原始订单',
        importRawOrderBadge: '原始订单派送表（表头映射）',
        importRawOrderMappingTitle: '原始订单派送表说明',
        importRawOrderMappingBody: `不要求列顺序与「下载模板」导出文件一致；首行须为表头，至少包含服务端可识别的柜号、派送地址等列（列名支持中英文别名，由后端映射）。
导入前会进行地址归一、UPS 行合并、中文逗号换行 Job/SH 等预处理；建议使用「解析并预览」核对后再确认入库。
错误提示以后端返回为准（如缺列、同一文件多柜号等）。`,
        importRawOrderNoTemplateHint: '原始表无需下载系统模板；列名对齐业务习惯即可。',
        importRawOrderSheet2Badge: '原始订单 · Sheet2（仅第二工作表）',
        importRawOrderSheet2MappingTitle: '原始订单 Sheet2 说明',
        importRawOrderSheet2MappingBody: `工作簿须包含第二个工作表（仅一张表会报错）。后端仅读取 Sheet2（sheetNo=1），先做承运商/双地址/非 HOLD 同址合并等处理，再走与「导入原始订单」相同的预处理与解析。
首行须为表头，至少包含服务端可识别的柜号、派送地址等列（列名支持中英文别名）。建议使用「解析并预览」核对后再确认入库。`,
        importExcelMappingTitle: '派送文件 Excel 列说明（由后端解析）',
        importExcelMappingTitleV2: '派送文件 Excel 列说明（V2 模板 · 由后端解析）',
        importMultiHint: '可选多个 Excel，每个文件解析为一条拆柜订单；最多 {max} 个文件。',
        importParsePreview: '解析并预览',
        importConfirmSubmit: '确认导入',
        importConfirmSerializeError:
          '导入确认数据无法序列化（一般为预览数据异常）。请关闭弹窗后重新上传并解析预览，若仍失败请导出控制台中以 [DevanningImport] 开头的日志。',
        importConfirmUnknownError: '确认导入异常，请查看控制台 [DevanningImport] 日志',
        importBackToFiles: '上一步',
        importPreviewTitle: '导入预览（共 {count} 个订单）',
        importPreviewHint: '右侧为各文件对应的柜号，点击后左侧查看主单字段与入库计划明细，确认无误后点击「确认导入」。',
        importPreviewPickCoNo: '请在右侧选择一个柜号查看详情。',
        importPreviewCoList: '柜号 / 来源文件',
        importPreviewInboundEditHint:
          '入库计划明细：平台（基础数据下拉）、仓库代码（选平台后可下拉）、地址类型（商业/私人）、派送方式、HOLD 支持双击单元格修改；修改在「确认导入」时一并提交。',
        importPreviewNoCoNo: '（无柜号）',
        importNeedFiles: '请先选择要导入的文件',
        importPreviewEmpty: '未解析到可导入的订单，请检查文件或联系管理员',
        doubleClickToEdit: '双击修改',
        importExcelMappingBody: `与业务派送类 Excel 列名对齐（示例如下）：
• container → 主单柜号 coNo（同一文件内应一致；多行共用该柜一条拆柜订单）
• Delivery Address → 入库计划 warehouseCode（仓库代码）
• Job No → 入库计划「订单号」（接口字段 systemSoNo）；单元格内多个 SO 若换行或空格分行，规范化后合并为英文逗号分隔的一个字段
• CTNS → 入库计划 totalPieces（总件数）
• SH ID/MARK → 入库计划 shipmentCode；多值同理换行等 → 英文逗号分隔
• KGS → weight；CBM → volumeCbm
• 备注列 → 入库计划 remark（行级备注，与主单 remark 不同对象）
• Hold 列：单元格包含子串 HOLD（不区分大小写）→ hold = true 且 deliveryMethod =「hold」；否则 → hold = false 且 deliveryMethod =「truck_delivery」（值以字典 delivery_type 为准）
• 预计打板数：导入时按体积计算 estimatedPalletCount = ceil(volumeCbm / 2)，volumeCbm≤0 时为 0（与 §5 新建规则一致）
主单其它字段（提单号等）若表中无列，可由后端留空或按现有默认规则填充；导入模板建议与上表列名一致。`,
        importExcelMappingBodyV2: `用于 **导入订单**（Sheet2）流程。请使用「下载模板」获取 **V2 表头**（含 **Carrier（承运商）**、**Remark** 与 **Delivery remark** 等分列；具体列名与解析规则以后端为准）。
预览为 **POST .../import-preview/v2**（multipart **files**）；确认落库仍为 **POST .../import-confirm**。
行级含义可与标准派送对齐的部分（container→柜号、Delivery Address→仓库代码等）以后端为准。`,
        newOrder: '新建单',
        createInboundHint:
          '请添加入库计划明细。系统预库位无需填写；预计打板数由体积(CBM)÷2 向上取整，列表中为预览，提交后由后端按同一规则落库。',
        addInboundPlanRow: '添加入库计划行',
        estimatedPalletAutoHint: '预计打板数 = 体积(CBM) ÷ 2 向上取整（与后端落库规则一致）',
        inboundPlanAtLeastOne: '请至少添加一条入库计划',
        inboundPlanRowNeedIdentifier: '第 {index} 行请至少填写「订单号」或「货件编码」之一',
        systemPreLocationPending: '由系统生成，无需手填',
        statusAll: '全部',
        quickStatus: '状态筛选',
        coNo: '柜号',
        orderDate: '下单日期',
        orderDateAutoTip: '提交当日，与创建日期一致',
        blNo: '提单号',
        statusColumn: '状态',
        attachmentsColumn: '附件',
        attachmentsUpload: '上传',
        attachmentsHas: '已上传({count})',
        attachmentsTitle: '附件',
        attachmentsCollapseTitle: '附件列表（{count}）',
        operationStatusColumn: '操作状态',
        operationStatusDevanningSheetPrinted: '拆柜单已打',
        operationStatusPalletLabelPrinted: '卡板贴已打',
        devanningCompleteTime: '拆柜完成时间',
        expectedDevanningTime: '预计拆柜时间',
        inboundWarehouse: '入库仓库',
        orderLevel: '订单等级',
        devanningStatus: '拆柜状态',
        orderLevelPlaceholder: '请输入数字',
        queuePosition: '排队序号',
        devanningDock: '拆柜口',
        driverPhone: '司机电话',
        driverPhonePlaceholder: '请输入司机电话',
        labelTag: '标签',
        cargoQty: '货物数量',
        cargoWeight: '货物重量',
        remarkColumn: '备注',
        more: '更多',
        deleteOrder: '删除订单',
        batchOperations: '批量操作',
        /** 列表区「更多」：按当前筛选导出货物订单 Excel（与后端约定列） */
        exportCargoOrders: '导出货物订单',
        batchDelete: '批量删除',
        batchDeleteNeedSelection: '请先勾选要删除的订单',
        batchDeleteConfirm: '确认删除选中的 {count} 条订单？删除规则与单行删除一致。',
        detail: '详情',
        exportSheet: '导出拆柜单',
        exportFileNamePrefix: '拆柜单',
        exportSheetHint:
          '在列表行「更多」中可导出拆柜单，或导出卡板贴（Word / ZIP / PDF）。拆柜单 Excel 与仓库模版一致；卡板贴：顶柜号、中为 仓库代码-HOLD-序号、底日期。PDF「直接打印」不落已打标记；「下载」落标记。',
        palletLabelWord: '卡板贴 · 导出 Word',
        palletLabelZip: '卡板贴 · 导出 ZIP',
        palletLabelPdfDirectPrint: '卡板贴 · PDF 直接打印',
        palletLabelPdf: '卡板贴 · PDF 下载',
        palletLabelPdfZip: '卡板贴 · 导出 PDF（ZIP）',
        palletLabelFilePrefix: '卡板贴',
        completeDevanning: '完成拆柜',
        completeConfirm: '确认将该订单标记为拆柜完成？',
        completeSuccess: '操作成功',
        fillRemark: '填写备注',
        remarkModalTitle: '填写备注',
        remarkPlaceholder: '请输入备注（选填）',
        cancelComplete: '取消拆柜完成',
        cancelCompleteConfirm: '确认取消该订单的拆柜完成状态？订单将回退为待拆柜等业务约定状态。',
        markAbnormal: '标记异常',
        markAbnormalConfirm: '确认将该订单标记为异常？',
        cancelAbnormal: '取消标记异常',
        cancelAbnormalConfirm: '确认取消该订单的异常标记？状态将按业务规则恢复（如待拆柜）。',
        detailTitle: '拆柜订单详情',
        detailTabBasic: '基础资料',
        detailTabInbound: '入库计划',
        inboundEditableFieldsHint:
          '平台（下拉选择已维护平台）、仓库代码（未选平台时手输；选平台后下拉）、地址类型（商业地址/私人地址）、派送方式、HOLD：双击单元格就地修改，保存后立即生效。',
        inboundPlan: {
          summaryTotalPieces: '总件数',
          summaryTotalCbm: '总CBM',
          systemPreLocation: '系统预库位',
          preLocationLine: '库位{index}：{location}（{pallets}板）',
          preLocationMore: '....',
          outboundStatus: '出库状态',
          outboundStatusPending: '未出库',
          outboundStatusDone: '已出库',
          editSystemPreLocation: '编辑系统预库位',
          editSystemPreLocationTitle: '编辑系统预库位',
          editSystemPreLocationHint:
            '维护本行入库计划对应的预分配库位及板数。点击「新增库位行」打开平面图：点库位会先弹出填写板数，加入列表后可继续改编码/板数或删除；保存后写入系统预库位。',
          preLocationModalSummaryTitle: '入库计划概要',
          preLocationModalCargoDoc: '货物与单证',
          preLocationAllocatedLinesTitle: '预分配库位（可改库位编码与板数）',
          preLocationPickPalletTitle: '填写该库位板数',
          preLocationPickPalletHint: '确认后加入下方「已选中」列表；仍可在列表中修改板数或删除。',
          preLocationPickSelectedEditableHint: '以下为已选库位，可直接改板数或删除；再次点击平面图上已选格可取消选中。',
          preLocationCodePlaceholder: '库位编码',
          preLocationPalletPlaceholder: '板数',
          addPreLocationLine: '新增库位行',
          preLocationPickFromMapTitle: '从仓库库存平面图选择预库位',
          preLocationPickFromMapHint:
            '在下方平面图中点击未选库位会先弹出板数填写；再次点击已选库位可取消。已选列表可随时改板数。色阶与「仓库库存可视化」一致。',
          preLocationPickSummaryPrefix: '已选中：',
          preLocationPickSummarySegment: '库位：{location}，{count}板',
          preLocationPickEmpty: '暂无选中。点击右侧库位格子，先填写板数后加入列表。',
          preLocationPickZoneFilter: '库区筛选',
          preLocationPickClickToggle: '点击格子多选/取消；色块表示库位占用情况',
          systemSoNo: '订单号',
          shipmentCode: '货件编码',
          platform: '平台',
          warehouseCode: '仓库代码',
          addressCol: '地址',
          addressType: '地址类型',
          addressTypeCommercial: '商业地址',
          addressTypePrivate: '私人地址',
          platformUnmatched: '未匹配平台',
          deliveryMethod: '派送方式',
          totalPieces: '总件数',
          weight: '重量',
          volumeCbm: '体积(CBM)',
          estimatedPalletCount: '预计打板数',
          lineRemark: '行备注',
          editTitle: '修改入库计划',
          holdOn: '暂扣',
          holdOff: '放行'
        },
        form: {
          coNoRequired: '请输入柜号',
          blNoRequired: '请输入提单号'
        },
        statusEnum: {
          pending_schedule: '待安排',
          pending_devanning: '待拆柜',
          completed: '拆柜完成',
          abnormal: '异常'
        }
      },
      driverCheckInRecord: {
        title: '司机 Check-in 记录',
        checkedInAt: 'Check-in 时间',
        checkedInTimeRange: 'Check-in 时间',
        driverPhone: '司机电话',
        driverPhonePlaceholder: '司机电话',
        noticeMessage: '柜号 {coNo} 已到仓登记 · 司机 {driverPhone}',
        noticePanelTitle: '消息通知',
        noticeSectionCheckIn: '到仓登记',
        noticeSectionOther: '其他消息',
        read: '已读',
        unread: '未读',
        readAll: '一键已读',
        readAllConfirm: '确定将全部通知标为已读？',
        viewAllRecords: '查看全部 Check-in 记录',
        noPermission: '无查看权限，请联系管理员开通 wms:driverCheckInRecord:list'
      },
      parkScheduling: {
        warehouseSelect: '仓库选择',
        selectWarehouseFirst: '请先选择仓库',
        taskPanel: '任务列表',
        expandTaskPanel: '展开任务列表',
        collapseTaskPanel: '收起任务列表',
        toolbarCollapseTitle: '筛选、汇总与操作',
        createTask: '新建任务',
        parkManagement: '园区管理',
        cabinetReportExportButton: '导出排柜表',
        cabinetReportTitle: '排柜表',
        cabinetReportModalTitle: '排柜表 · 预览与打印',
        cabinetReportDateLabel: '报表日期',
        cabinetReportDateHint: '仅表头展示；表格数据为当前看板（与顶部拆柜/装车筛选一致）',
        cabinetReportPrintPdf: '打印 / 保存为 PDF',
        cabinetReportDockSection: '道口',
        cabinetReportEmptyDock: '暂无任务',
        cabinetReportPrintFailed: '无法唤起打印，请检查浏览器弹窗或重试',
        cabinetReportWarehouseIn: '在仓',
        cabinetReportWarehouseNotArrived: '未到仓',
        boardEmpty: '暂无 Dock 布局，请先在园区管理中维护道口',
        frontYardDivider: '前院',
        locationAreaUnset: '未设置位置类型',
        tabAllWork: '全部',
        tabPendingWork: '待作业',
        tabInProgressWork: '作业中',
        tabCompletedWork: '已完成',
        tabNotArrivedWork: '未到仓',
        taskType: '任务类型',
        taskTypeDevanning: '拆柜任务',
        taskTypeLoading: '装车任务',
        releaseDockButton: '释放道口',
        releaseDockModalTitle: '释放道口',
        releaseDockField: '选择道口',
        releaseDockPlaceholder: '输入道口名称或位置类型，模糊匹配',
        releaseDockHint:
          '确认后将该道口上的全部海柜调度任务置为「已完成」，并释放道口占用（与顶栏当前任务类型一致）。',
        releaseDockPickDock: '请选择或输入匹配的道口',
        releaseDockConfirm:
          '道口「{dock}」上的全部海柜（约 {count} 个）将变更为「已完成」并释放该道口，是否继续？',
        releaseDockSuccess: '已释放道口「{dock}」',
        coNo: '柜号',
        coNoOpenDetailHint: '双击查看拆柜订单详情',
        coNoOpenDetailNoOrder: '无法打开详情：未关联拆柜订单（装车任务请从拆柜订单列表查看）',
        columnDock: 'Dock',
        coNoSearchPlaceholder: '输入柜号筛选，回车或搜索',
        plannedWorkTimeFilter: '预计拆柜时间',
        plannedWorkTimeRangePlaceholder: '默认当日，可清空查全部',
        coNoBatch: '柜号（批量）',
        coNoBatchPlaceholder:
          '一行一个柜号，或用逗号、分号、空格分隔',
        coNoBatchPlaceholderDevanning:
          '每行：柜号 状态 [车数/体积] [道口号]。例：YMLU9552149 拆柜中 1/30 43（43 模糊匹配道口名称→拆柜口）。拆柜中须带道口；状态：已到待拆/柜子未到/库存更新/已到拆完/拆柜中。含「-」柜号无效',
        coNoBatchParsedWithDock: '；已匹配道口 {count} 条',
        coNoBatchParsed: '已识别 {count} 个柜号',
        coNoBatchParsedDevanning:
          '已识别 {count} 个：已到待拆 {pending}、未到仓 {notArrived}、拆柜中 {inProgress}、库存更新 {inventoryUpdate}、已到拆完 {completed}',
        coNoBatchParsedWithRatio: '；含车数/体积 {count} 条',
        coNoBatchParsedSkipped: '；已跳过 {count} 行（含「-」柜号等）',
        batchFailure: {
          CO_NO_HYPHEN: '柜号含「-」，不参与园区调度',
          ORDER_NOT_FOUND: '未找到对应拆柜订单或柜号无效',
          DOCK_NOT_MATCHED: '道口识别码未匹配到任何道口',
          DOCK_REQUIRED_IN_PROGRESS: '拆柜中须指定道口（粘贴末尾道口号或从 Dock 卡片新建）'
        },
        batchAutoAssignSummary: '已自动分配道口（预计拆柜日 {date}）：成功 {assigned} 条，未分配 {skipped} 条',
        batchAutoAssignTab: '道口分配（{count}）',
        batchAutoAssignRow: '道口 {dock}，等级 {level}',
        batchCreateSuccess: '已成功更新 {count} 条拆柜订单',
        batchResultButton: '任务结果',
        batchResultTitle: '新建任务结果',
        batchResultSummary: '成功 {success} 条，失败 {fail} 条',
        batchResultSuccessTab: '成功（{count}）',
        batchResultFailTab: '失败（{count}）',
        batchResultAllFailed: '全部失败：未找到对应海柜/拆柜订单，或字段校验未通过。',
        batchResultPartial: '部分柜号未匹配到拆柜订单，请查看失败明细。',
        batchResultEmpty: '暂无批量任务结果',
        assignBusinessTypeMismatch: '任务业务类型与 Dock 不一致，请拖到对应类型的道口',
        orderLevel: '等级',
        orderLevelPlaceholder: '选填，请输入数字',
        plannedWorkTime: '待作业时间',
        plannedWorkTimeBegin: '开始日期',
        plannedWorkTimeEnd: '结束日期',
        devanningRound: '作业轮次',
        status: '状态',
        statusPending: '待作业',
        statusQueued: '排队中',
        statusNotArrived: '未到仓',
        statusArrivedToQueue: '到仓并入队',
        statusInProgress: '作业中',
        notArrivedTasks: '未到仓（不占排队序）',
        noNotArrivedTasks: '暂无未到仓任务',
        statusCompleted: '已完成',
        slotEmpty: '空位',
        assignSuccess: '已指派到 Dock',
        statusUpdateSuccess: '任务状态已更新',
        revertCompletedToPending: '改回待作业',
        createTaskDockPresetCurrent: '新建任务将提交到道口「{name}」，并尽量作为「当前作业」（仅当该道口尚无作业中任务时成功；否则请用「排队」或稍后重试）。',
        createTaskDockPresetQueued: '新建任务将提交到道口「{name}」并进入排队。',
        inlinePatchSuccess: '已保存',
        tableDoubleClickEditHint: '双击可编辑，支持清空',
        statsTotalTasks: '作业总数量',
        statsPendingTasks: '待作业数量',
        statsCompletedTasks: '已完成作业数量',
        statsDockInProgress: 'Dock 作业中数量',
        dockQueueTitle: 'Dock {name} · 任务队列',
        currentTask: '当前作业',
        queuedTasks: '排队任务',
        taskNo: '任务号',
        noCurrentTask: '当前无作业任务',
        noQueuedTasks: '暂无排队任务',
        workSortOrder: '作业排序',
        workSortCurrent: '当前',
        dockQueueDragHint:
          '按住整行拖动调整顺序（避开右侧状态下拉），松手后自动保存排队顺序；拆柜任务会按新顺序用「作业轮次」字典对齐并 PATCH 落库。排队任务可拖到其他道口卡片上完成改派。',
        dragToReorder: '拖动排序',
        queueReorderSuccess: '排队顺序已保存',
        queueCrossDockTransferSuccess: '已迁移到其他道口排队',
        queueCrossDockConfirm:
          '确认将柜号「{coNo}」的排队任务迁至道口「{toDockName}」？源道口与目标道口的排队顺序及拆柜轮次将更新；若原道口当前有作业中任务，其余排队将自动前移。',
        remark: '备注',
        form: {
          coNoRequired: '请输入柜号',
          coNoBatchEmpty:
            '请至少输入一个有效柜号（拆柜：柜号 + 状态，支持 已到待拆/库存更新/柜子未到/拆柜中/已到拆完）',
          coNoBatchSkippedOnly: '有内容但未解析出柜号，请检查格式（示例：WHSU6333392 已到待拆）',
          coNoBatchHyphenSkipped: '已跳过 {count} 个含「-」的柜号，请去掉连字符后重试',
          coNoBatchDockSkipped: '有内容但无有效柜号：道口未匹配或「拆柜中」未指定道口',
          orderLevelRequired: '请输入拆柜等级',
          plannedWorkTimeRequired: '请选择预计拆柜时间'
        }
      },
      parkManagement: {
        warehouseSelect: '仓库选择',
        tabDock: '道口',
        tabParking: '停车位',
        slotName: '道口名称',
        slotType: '类型',
        businessType: '业务类型',
        businessTypeDevanning: '拆柜',
        businessTypeLoading: '装车',
        locationArea: '位置类型',
        locationAreaPlaceholder: '请选择位置类型',
        parkingLimit: '限制停车数',
        sortOrder: '排序',
        priority: '调度优先级',
        priorityPlaceholder: '从 1 起，数字越小越优先',
        parkingLimitPlaceholder: '默认 1 辆',
        adjustParkingLimit: '调整限制停车数',
        restoreParkingLimitDefault: '恢复默认',
        vehicleUnit: '辆',
        yardZone: '院区分区',
        yardFront: '前院',
        yardBack: '后院',
        status: '状态',
        statusOpen: '开放',
        statusClosed: '关闭',
        remark: '备注',
        addSlot: '新增道口/停车位',
        editSlot: '编辑道口/停车位',
        form: {
          slotNameRequired: '请输入名称',
          businessTypeRequired: '请选择业务类型',
          locationAreaRequired: '请选择位置类型（看板分区顺序按字典排序）',
          warehouseRequired: '请选择仓库'
        }
      },
      cargoInboundPlan: {
        title: '货物订单',
        systemSoNo: '订单号',
        locationCode: '库位',
        zoneCode: '库区',
        phaseAll: '全部',
        phaseNotInStock: '未入库',
        phaseNotInStockHint: '未分配库位、尚未进入库存数据',
        phaseInStock: '已入库',
        phaseInStockHint: '已有库存数据',
        phaseOutStock: '已出库',
        phaseOutStockHint: '已出库完成'
      },
      devanningImportInventory: {
        title: '库存列表',
        coNo: '柜号',
        blNo: '提单号',
        warehouseCode: '仓库代码',
        systemSoNo: '订单号',
        shipmentCode: '货件编码',
        preLocationCode: '预排库位',
        sourceFileName: '来源文件',
        importTime: '导入时间'
      },
      inventoryData: {
        title: '库存数据',
        orderTime: '下单日期',
        devanningCompleteTime: '拆柜完成日期',
        orderNo: '订单号',
        coNo: '柜号',
        shipmentCode: '货件编码',
        zoneCode: '库区',
        locationCode: '库位',
        palletCount: '打板数',
        deliveryAddress: 'Delivery Address',
        platform: '平台',
        deliveryMethod: '派送方式',
        weight: '重量',
        volumeCbm: '体积',
        totalPieces: '件数',
        remark: '备注',
        outstock: '出库',
        manualOutstockTooltip: '手动出库',
        manualOutstockTitle: '手动出库',
        manualOutstockHint:
          '按当前库存明细行提交出库：默认一次性出清本行在列表中的全部打板数，无需填写数量。后台应与「上传 PDF 出库」走同一套或等价的出库与库存扣减逻辑（由后端实现）。',
        manualOutstockOutAllNote: '本次将出库本行全部板数：{count} 板（与上表「打板数」一致）。',
        manualOutstockSubmit: '确认出库',
        manualOutstockSuccess: '出库已提交',
        manualOutstockNoPallet: '当前行打板数为 0，无法出库。',
        manualOutstockRejected: '出库未通过，请查看接口返回说明。',
        outstockModalTitle: '出库上传',
        outstockModalTip: '将出库单据 PDF 拖拽到此处，或点击选择文件',
        outstockModalNoticeTitle: '说明',
        outstockModalNoticeBody: '上传后将由系统处理出库相关流程；请核对 PDF 内容与订单一致。',
        outstockSubmit: '上传并出库',
        outstockNeedFile: '请先选择 PDF 文件',
        editTitle: '编辑库存数据',
        preLocationPickContextTitle: '当前库存行',
        currentLocationCode: '现有库位',
        doubleClickToEditLocation: '双击从平面图选择库位',
        doubleClickToEditPallet: '双击编辑打板数',
        preLocationPickNeedExactlyOne: '请只选择一个库位后再确认',
        preLocationSyncFailed: '库存明细已更新，但同步入库计划系统预库位失败，请刷新后核对',
        missingInboundPlanForPreLocationSync: '缺少入库计划或订单信息，无法同步系统预库位',
        missingInventoryDetailId: '缺少明细记录 id，无法编辑',
        outstockUploadSuccess: '出库文件上传成功',
        outstockResultTitle: '出库处理结果',
        outstockResultStatus: '出库状态',
        outstockResultMessage: '说明',
        outstockResultNoDetail: '出库已受理；后端未返回明细行，请以实际库存与单据为准。',
        outstockBackToUpload: '重新上传',
        outstockResultDone: '完成',
        existingImportTitle: '导入现有库存',
        existingImportPreviewTitle: '导入预览（共 {count} 行）',
        existingImportSubmitImport: '提交导入',
        existingImportDirectHint:
          '选择 Excel 后点击「提交导入」，文件由后台异步解析与落库；进度与结果请在「导入任务」中查看。',
        existingImportSingleFileHint: '请上传 Excel；系统按海柜号、Job No.（与系统订单号模糊匹配）、FBA Code（同 Delivery Address）判断是否跳过或写入。',
        existingImportNoticeTitle: '规则说明',
        existingImportNoticeBody:
          '1）若系统中已存在同一海柜 + 匹配到的订单（Job No.）+ 同一 FBA Code（Delivery Address）组合，则本行跳过、不重复写入。\n2）若不存在：需创建对应海柜（拆柜订单）并新增入库计划行（或仅追加入库计划，以后端拆单规则为准）。\n3）库存列表里「订单号」可能由多条业务记录聚合成一条展示，表格中的 Job No. 需与系统订单号做模糊匹配（如包含关系、去空格/大小写、聚合单号包含片段等，由后端实现）。\n4）若匹配到多条候选订单，由后端在异步导入中判定；明细与失败原因请在「导入任务」中查看。',
        existingImportColRowNum: '行号',
        existingImportColInventoryStatus: '库存状态',
        existingImportColRowResultMessage: '处理说明',
        existingImportColJobNo: 'Job No.',
        existingImportColMatchedOrder: '匹配订单号',
        existingImportColFba: 'FBA / Delivery',
        existingImportColMatchType: '匹配方式',
        existingImportColAction: '计划动作',
        existingImportColCandidates: '候选说明',
        existingImportColError: '错误/提示',
        existingImportNeedFile: '请先选择 Excel 文件',
        existingImportPreviewEmpty: '未解析到有效数据行',
        existingImportNoValidRows: '没有可确认导入的有效行（请处理标红的错误行）',
        existingImportPreviewHint: '请核对「匹配订单号」与「计划动作」；确认后将按后端规则落库。',
        existingImportPreviewErrorSummary: '其中 {error} 行存在问题，{valid} 行可导入。',
        existingImportLongRunningWarning:
          '数据量较大时，解析可能需较长时间；预览阶段请勿重复提交。「确认导入」后任务在后台执行，无需在此等待；请在「导入任务」中查看进度与结果。',
        existingImportAccepted: '任务已受理，正在后台导入…',
        existingImportSubmitOk: '导入任务已提交；请在「导入任务」中查看进度与结果。',
        existingImportTaskButton: '导入任务',
        existingImportTasksModalTitle: '导入任务',
        existingImportTasksHint: '以下为本次会话提交的异步导入任务；进行中可中断，完成后可查看明细。',
        existingImportTaskId: '任务编号',
        existingImportTaskStatus: '状态',
        existingImportTaskSubmittedAt: '提交时间',
        existingImportTaskCounts: '进度',
        existingImportTaskTotal: '总行',
        existingImportTaskOk: '成功',
        existingImportTaskFail: '失败',
        existingImportTaskDetailTitle: '导入任务详情',
        existingImportTaskView: '查看',
        existingImportTaskInterrupt: '中断',
        existingImportTaskInterruptConfirm: '确定中断该导入任务？已处理部分可能已落库，以系统数据为准。',
        existingImportTaskCancelSuccess: '已请求中断任务',
        existingImportTaskStatusUnknown: '待同步',
        existingImportTaskStatusSuccess: '成功',
        existingImportTaskStatusFailed: '失败',
        existingImportTaskStatusCancelled: '已中断',
        existingImportTaskStatusPending: '排队中',
        existingImportTaskStatusRunning: '执行中',
        existingImportTaskRunningTag: '进行中',
        existingImportTaskUnread: '未读结果',
        existingImportTaskMarkAllRead: '全部已读',
        existingImportTaskResultRows: '处理明细',
        existingImportTaskTabSuccess: '成功',
        existingImportTaskTabFailed: '失败',
        existingImportTaskTabEmpty: '暂无数据',
        existingImportTaskDetailFilterInventoryStatus: '库存状态',
        existingImportTaskDetailFilterInventoryStatusPh: '全部',
        existingImportTaskNoRows: '暂无行级明细（后端可在任务完成后返回 resultRows）。',
        existingImportTaskLoadingStatus: '正在拉取任务状态…',
        existingImportTaskNoErrorDetail: '未返回具体失败原因，请联系管理员或查看服务端日志。',
        existingImportMissingTaskId: '服务端未返回任务编号，无法查询导入进度；请稍后重试或联系管理员。',
        existingImportPollTimeout: '等待导入结果超时，请稍后在库存数据中核对是否已写入。',
        existingImportPollNetworkError: '查询导入进度失败，请检查网络后重试。',
        existingImportAction: {
          skip: '跳过（已存在）',
          create_order_and_plan: '新建海柜并入计划',
          add_inbound_plan: '追加入库计划',
          auto_outbound: '自动出库',
          ambiguous: '待人工确认',
          error: '无法导入'
        }
      },
      inventoryDataDashboard: {
        pageHeading: '库存与出库数据看板',
        title: '库存数据看板',
        hint: '按仓库代码汇总打板数（后端聚合），板数从高到低；筛选参数与「库存数据」列表一致，可在后续版本中接入同一套搜索条件。',
        topCount: '展示仓库数',
        presetPlaceholder: '快捷条数',
        manualPlaceholder: '自定义 1–500',
        palletCountAxis: '板数（合计）',
        palletCountSeries: '板数合计',
        emptyWarehouseCode: '（空仓库代码）',
        statsLine:
          '不同仓库代码共 {warehouses} 个（满足筛选口径）；当前图表展示接口返回的前 {shown} 个（按板数合计降序）。',
        loadFailed: '加载库存数据失败，请稍后重试'
      },
      outstockDataDashboard: {
        title: '出库数据看板',
        hint:
          '按仓库代码汇总出库记录的打板数合计（后端聚合），板数从高到低。默认按出库记录创建时间筛选为「今天起往前一周」至今日；可与「出库数据」列表共用其它筛选参数。',
        topCount: '展示仓库数',
        presetPlaceholder: '快捷条数',
        manualPlaceholder: '自定义 1–500',
        palletCountAxis: '板数（合计）',
        palletCountSeries: '板数合计',
        emptyWarehouseCode: '（空仓库代码）',
        statsLine:
          '不同仓库代码共 {warehouses} 个（满足筛选口径）；当前图表展示接口返回的前 {shown} 个（按板数合计降序）。',
        loadFailed: '加载出库看板数据失败，请稍后重试'
      },
      outstockData: {
        title: '出库数据',
        createTimeRange: '创建时间',
        outstockBatchNo: '出库批次',
        loadingSequenceNo: '装车序号',
        coNo: '柜号',
        orderNo: '订单号',
        shipmentCode: '货件编码',
        deliveryAddress: 'Delivery Address',
        platform: '平台',
        deliveryMethod: '派送方式',
        palletCount: '板数',
        zoneCode: '库区',
        locationCode: '库位',
        weight: '重量',
        volumeCbm: '体积',
        totalPieces: '总件数',
        cancelOutstock: '取消出库',
        cancelConfirm: '确认取消出库？删除出库记录后数据将回到库存数据，入库计划对应行将变为未出库。',
        cancelSuccess: '已取消出库'
      },
      outstockException: {
        title: '出库异常数据',
        outstockBatchNo: '出库批次',
        loadingSequenceNo: '装车序号',
        coNo: '柜号',
        orderNo: '订单号',
        exceptionCount: '异常条数',
        lastExceptionTime: '最近异常时间',
        createTime: '创建时间',
        viewDetail: '详情',
        detailTitle: '出库异常明细（批次：{batch}）',
        detailTitleFallback: '出库异常明细',
        detailOrderNo: '订单号',
        detailCoNo: '柜号',
        detailFbacode: 'Fbacode',
        exceptionType: '异常类型',
        exceptionMessage: '异常说明',
        detailTime: '时间'
      },
      warehouseInventoryMap: {
        title: '仓库库存可视化',
        zoneAll: '全部库区',
        frameTitle: '库内平面',
        cellRemainingAvailable: '剩余可用库容',
        cellPalletUnit: '板',
        warehouseCodeInventoryEmpty: '暂无仓库代码占用',
        noLocations: '暂无库位数据',
        noLocationsInFilter: '当前没有可展示的库位（例如左侧已关闭全部库区的平面图显示）。',
        floorPlanVisibility: '平面图',
        mapScale: '缩放',
        mapScaleReset: '默认',
        mapWrapHint: '卡片在可视区域内自动换行',
        occupancyLegend: '使用率色阶',
        occupancyEmpty: '空 (0%)',
        occupancyLow: '低 (1–49%)',
        occupancyModerate: '中 (50–79%)',
        occupancyHigh: '高 (80–94%)',
        occupancyCritical: '临界 (95%+)',
        occupancyUnknown: '库容无效',
        collapseAreaSidebar: '收起库区列表',
        expandAreaSidebar: '展开库区列表',
        searchInventoryWarehouseCode: '库存仓库代码',
        searchInventoryWarehouseCodePlaceholder: '如 ONT8：含该代码货物的库位与空库位',
        putawayRuleFilter: '上架规则筛选'
      },
      putawayRule: {
        title: '上架配置',
        addRule: '新建规则',
        editRule: '编辑规则',
        ruleTarget: '规则对象',
        conditionCombine: '多条上架条件组合',
        opAnd: '且（AND）',
        opOr: '或（OR）',
        searchAreaName: '区域名称',
        searchLocationCode: '库位号',
        searchPlatformCode: '平台代码',
        putawayPlatformOptional: '可选，不选表示不按平台过滤',
        targetKindHint:
          '规则对象四选一：按库区仅选库区；按库位需先选库区（必填）再选库位（可多选）；按类型/存放方式为字典多选。',
        targetByArea: '按库区',
        targetByLocation: '按库位（库区+库位）',
        locationModeAreaLabel: '库区',
        locationModeLocationLabel: '库位',
        targetByAreaType: '按库区类型',
        targetByStorage: '按存放方式',
        multiSelectArea: '可多选库区',
        multiSelectLocation: '可多选库位',
        multiSelectAreaType: '可多选库区类型',
        multiSelectStorage: '可多选存放方式',
        scopeNeedOneValue: '请在当前规则维度下至少选择一项',
        scopeNeedWarehouseArea: '按库位时请至少选择一个库区',
        dispatchMethodRequired: '第 {index} 条上架条件请填写派送方式',
        fallbackAllocationButton: '分配兜底库区库位',
        fallbackModalTitle: '分配兜底库区库位',
        fallbackHint:
          '当系统预库位自动分配无法命中规则或需要兜底时，仅在下列库区（及可选库位）范围内选取。库区、库位均可为空（保存后即表示不启用兜底范围）；也可用「清除兜底库区」一键清空后再保存。',
        fallbackAreaLabel: '兜底库区',
        fallbackAreaPlaceholder: '请选择库区，可多选',
        fallbackAreaRequired: '请至少选择一个库区',
        fallbackClearAreasButton: '清除兜底库区',
        fallbackLocationLabel: '兜底库位',
        fallbackLocationPlaceholder: '可选；不选表示不限定具体库位。仅展示已选库区下的库位'
      },
      prelocationExceptionLog: {
        title: '预分配异常日志',
        orderNo: '订单号',
        orderNoPlaceholder: '入库计划订单号（如系统 SO）',
        coNo: '柜号',
        coNoPlaceholder: '柜号',
        shipmentCode: '货件编码',
        shipmentCodePlaceholder: '货件编码',
        estimatedPalletCount: '预计打板数',
        exceptionType: '异常类型',
        exceptionTypePlaceholder: '请选择异常类型',
        exceptionReason: '异常原因',
        exceptionReasonKeyword: '异常原因',
        exceptionReasonKeywordPlaceholder: '异常原因关键字',
        logTime: '记录时间',
        logTimeRange: '记录时间'
      },
      inventory: {
        warehouseArea: {
          title: '库区管理',
          batchOperation: '批量操作',
          addArea: '新增区域',
          areaName: '区域名称',
          areaNameCol: '区域',
          areaType: '库区类型',
          storageMethod: '存放方式',
          locationMixedStorage: '库位混合存储',
          maxMixedQty: '最大混合数量',
          putawayCondition: '上架条件',
          editPutaway: '编辑上架条件',
          putawayNotSet: '未设置',
          putawayPriority: '优先级',
          putawayDispatchMethod: '派送方式',
          putawayDispatchMethodPlaceholder: '请选择派送方式',
          putawayPlatform: '平台',
          putawayPlatformPlaceholder: '请选择平台',
          putawayPlatformCodes: '平台代码',
          putawayPlatformCodesPlaceholder: '请输入平台代码',
          putawayPlatformRequired: '请选择平台',
          putawayOr: 'OR',
          putawaySummaryPriority: '优先级{num}',
          putawaySummaryAllCodes: '不限仓库',
          putawaySummaryBetweenRules: '；或 ',
          putawaySummaryUnknownPlatform: '平台 {id}',
          createTime: '创建时间',
          form: {
            areaNameRequired: '请输入区域名称',
            maxMixedQtyRequired: '请输入最大混合数量'
          },
          editArea: '编辑库区'
        },
        location: {
          title: '库位管理',
          areaList: '库区',
          allLocations: '全部库位',
          allLocationsHint: '不按库区过滤，显示全部库位',
          areaSearchPlaceholder: '搜索库区名称',
          expandSearch: '展开搜索',
          collapseSearch: '收起搜索',
          detailTitle: '库位详情',
          searchWarehouseArea: '库区',
          searchWarehouseAreaPlaceholder: '请选择库区',
          searchLocationKeyword: '库位编码',
          searchLocationKeywordPlaceholder: '模糊查询库位编码',
          addLocation: '新增库位',
          editLocation: '编辑库位',
          importLocation: '导入库位',
          changeStatus: '修改状态',
          zone: '区域',
          location: '库位',
          rowRank: '行',
          columnRank: '列',
          capacity: '库位容量',
          currentStock: '现有库存',
          remainingCapacity: '剩余容量',
          totalPalletCount: '总打板数量',
          priority: '优先级',
          status: '状态',
          statusEnable: '批量启用',
          statusDisable: '批量停用',
          form: {
            zoneRequired: '请选择库区',
            zoneSelectPlaceholder: '请选择库区',
            locationRequired: '请输入库位编码',
            statusRequired: '请选择状态'
          }
        }
      }
    },
    about: {
      title: '关于',
      introduction: `RuoYi-Plus-Soybean 是一个现代化的企业级多租户管理系统，它结合了 RuoYi-Vue-Plus 的强大后端功能和 Soybean Admin 的现代化前端特性。`,
      projectInfo: {
        title: '项目信息',
        version: '版本',
        latestBuildTime: '最新构建时间',
        documentLink: '文档地址',
        previewLink: '预览地址',
        repositoryLink: '仓库地址'
      },
      prdDep: '生产依赖',
      devDep: '开发依赖'
    }
  },
  form: {
    required: '不能为空',
    userName: {
      required: '请输入用户名',
      invalid: '用户名格式不正确'
    },
    phone: {
      required: '请输入手机号',
      invalid: '手机号格式不正确'
    },
    pwd: {
      required: '请输入密码',
      invalid: '密码格式不正确，6-18位字符，包含字母、数字、下划线'
    },
    confirmPwd: {
      required: '请输入确认密码',
      invalid: '两次输入密码不一致'
    },
    code: {
      required: '请输入验证码',
      invalid: '验证码格式不正确'
    },
    email: {
      required: '请输入邮箱',
      invalid: '邮箱格式不正确'
    }
  },
  dropdown: {
    closeCurrent: '关闭',
    closeOther: '关闭其它',
    closeLeft: '关闭左侧',
    closeRight: '关闭右侧',
    closeAll: '关闭所有',
    pin: '固定标签',
    unpin: '取消固定'
  },
  icon: {
    themeConfig: '主题配置',
    themeSchema: '主题模式',
    lang: '切换语言',
    fullscreen: '全屏',
    fullscreenExit: '退出全屏',
    reload: '刷新页面',
    collapse: '折叠菜单',
    expand: '展开菜单',
    pin: '固定',
    unpin: '取消固定'
  },
  datatable: {
    itemCount: '共 {total} 条',
    fixed: {
      left: '左固定',
      right: '右固定',
      unFixed: '取消固定'
    }
  }
};

export default local;
