const local: App.I18n.Schema = {
  system: {
    title: 'Forest Management System',
    updateTitle: 'System Version Update Notification',
    updateContent: 'A new version of the system has been detected. Do you want to refresh the page immediately?',
    updateConfirm: 'Refresh immediately',
    updateCancel: 'Later'
  },
  common: {
    action: 'Action',
    add: 'Add',
    addSuccess: 'Add Success',
    detail: 'Detail',
    backToHome: 'Back to home',
    batchDelete: 'Batch Delete',
    import: 'Import',
    export: 'Export',
    importSuccess: 'Import Success',
    importFail: 'Import Fail',
    importTemplate: 'Import Template',
    importResult: 'Import Result',
    downloadTemplate: 'Download Template',
    importEnd: '',
    importFormat: 'and the format is',
    importTip: 'Please upload a file no larger than',
    importSize: 'Please upload a file no larger than',
    exportSuccess: 'Export Success',
    exportFail: 'Export Fail',
    updateExisting: 'Whether to update the existing user data',
    cancel: 'Cancel',
    close: 'Close',
    check: 'Check',
    selectAll: 'Select All',
    expandColumn: 'Expand Column',
    columnSetting: 'Column Setting',
    config: 'Config',
    login: 'Login',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    deleteSuccess: 'Delete Success',
    confirmDelete: 'Are you sure you want to delete?',
    edit: 'Edit',
    download: 'Download',
    preview: 'Preview',
    name: 'Name',
    status: 'Status',
    warning: 'Warning',
    error: 'Error',
    failed: 'Failed',
    index: 'Index',
    keywordSearch: 'Please enter keyword',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to log out?',
    lookForward: 'Coming soon',
    modify: 'Modify',
    modifySuccess: 'Modify Success',
    more: 'More',
    noData: 'No Data',
    operate: 'Operate',
    pleaseCheckValue: 'Please check whether the value is valid',
    refresh: 'Refresh',
    reset: 'Reset',
    search: 'Search',
    switch: 'Switch',
    tip: 'Tip',
    trigger: 'Trigger',
    update: 'Update',
    saveSuccess: 'Save Success',
    updateSuccess: 'Update Success',
    noChange: 'No actions were taken',
    userCenter: 'User Center',
    yesOrNo: {
      yes: 'Yes',
      no: 'No'
    },
    second: 'Second',
    selected: 'selected',
    anyRecords: 'records',
    clear: 'Clear',
    noSelectRecord: 'No Records Selected'
  },
  request: {
    logout: 'Logout user after request failed',
    logoutMsg: 'User status is invalid, please log in again',
    logoutWithModal: 'Pop up modal after request failed and then log out user',
    logoutWithModalMsg: 'User status is invalid, please log in again',
    refreshToken: 'The requested token has expired, refresh the token',
    tokenExpired: 'The requested token has expired'
  },
  theme: {
    themeDrawerTitle: 'Theme Configuration',
    tabs: {
      appearance: 'Appearance',
      layout: 'Layout',
      general: 'General',
      preset: 'Preset'
    },
    appearance: {
      themeSchema: {
        title: 'Theme Schema',
        light: 'Light',
        dark: 'Dark',
        auto: 'Follow System'
      },
      grayscale: 'Grayscale',
      colourWeakness: 'Colour Weakness',
      themeColor: {
        title: 'Theme Color',
        primary: 'Primary',
        info: 'Info',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
        followPrimary: 'Follow Primary'
      },
      themeRadius: {
        title: 'Theme Radius'
      },
      recommendColor: 'Apply Recommended Color Algorithm',
      recommendColorDesc: 'The recommended color algorithm refers to',
      preset: {
        title: 'Theme Presets',
        switchHint:
          'Pick a preset below and click Apply to switch the full look and feel (including “Silver Neon 3D”).',
        apply: 'Apply',
        applySuccess: 'Preset applied successfully',
        default: {
          name: 'Default Preset',
          desc: 'Default theme preset with balanced settings'
        },
        soybean: {
          name: 'Soybean',
          desc: 'Default theme preset of SoybeanAdmin'
        },
        dark: {
          name: 'Dark Preset',
          desc: 'Dark theme preset for night time usage'
        },
        compact: {
          name: 'Compact Preset',
          desc: 'Compact layout preset for small screens'
        },
        azir: {
          name: "Azir's Preset",
          desc: 'It is a cold and elegant preset that Azir likes'
        },
        silverNeon3d: {
          name: 'Silver Neon 3D',
          desc: 'Silver-gray gradient shell, neon accents, embossed 3D buttons and cards'
        }
      }
    },
    layout: {
      layoutMode: {
        title: 'Layout Mode',
        vertical: 'Vertical Mode',
        horizontal: 'Horizontal Mode',
        'vertical-mix': 'Vertical Mix Mode',
        'vertical-hybrid-header-first': 'Left Hybrid Header-First',
        'top-hybrid-sidebar-first': 'Top-Hybrid Sidebar-First',
        'top-hybrid-header-first': 'Top-Hybrid Header-First',
        vertical_detail: 'Vertical menu layout, with the menu on the left and content on the right.',
        'vertical-mix_detail':
          'Vertical mix-menu layout, with the primary menu on the dark left side and the secondary menu on the lighter left side.',
        'vertical-hybrid-header-first_detail':
          'Left hybrid layout, with the primary menu at the top, the secondary menu on the dark left side, and the tertiary menu on the lighter left side.',
        horizontal_detail: 'Horizontal menu layout, with the menu at the top and content below.',
        'top-hybrid-sidebar-first_detail':
          'Top hybrid layout, with the primary menu on the left and the secondary menu at the top.',
        'top-hybrid-header-first_detail':
          'Top hybrid layout, with the primary menu at the top and the secondary menu on the left.'
      },
      tab: {
        title: 'Tab Settings',
        visible: 'Tab Visible',
        cache: 'Tag Bar Info Cache',
        cacheTip: 'Keep the tab bar information after leaving the page',
        height: 'Tab Height',
        mode: {
          title: 'Tab Mode',
          slider: 'Slider',
          chrome: 'Chrome',
          button: 'Button'
        },
        closeByMiddleClick: 'Close Tab by Middle Click',
        closeByMiddleClickTip: 'Enable closing tabs by clicking with the middle mouse button'
      },
      header: {
        title: 'Header Settings',
        height: 'Header Height',
        breadcrumb: {
          visible: 'Breadcrumb Visible',
          showIcon: 'Breadcrumb Icon Visible'
        }
      },
      sider: {
        title: 'Sider Settings',
        inverted: 'Dark Sider',
        width: 'Sider Width',
        collapsedWidth: 'Sider Collapsed Width',
        mixWidth: 'Mix Sider Width',
        mixCollapsedWidth: 'Mix Sider Collapse Width',
        mixChildMenuWidth: 'Mix Child Menu Width',
        autoSelectFirstMenu: 'Auto Select First Submenu',
        autoSelectFirstMenuTip:
          'When a first-level menu is clicked, the first submenu is automatically selected and navigated to the deepest level'
      },
      footer: {
        title: 'Footer Settings',
        visible: 'Footer Visible',
        fixed: 'Fixed Footer',
        height: 'Footer Height',
        right: 'Right Footer'
      },
      content: {
        title: 'Content Area Settings',
        scrollMode: {
          title: 'Scroll Mode',
          tip: 'The theme scroll only scrolls the main part, the outer scroll can carry the header and footer together',
          wrapper: 'Wrapper',
          content: 'Content'
        },
        page: {
          animate: 'Page Animate',
          mode: {
            title: 'Page Animate Mode',
            fade: 'Fade',
            'fade-slide': 'Slide',
            'fade-bottom': 'Fade Zoom',
            'fade-scale': 'Fade Scale',
            'zoom-fade': 'Zoom Fade',
            'zoom-out': 'Zoom Out',
            none: 'None'
          }
        },
        fixedHeaderAndTab: 'Fixed Header And Tab'
      }
    },
    general: {
      title: 'General Settings',
      watermark: {
        title: 'Watermark Settings',
        visible: 'Watermark Full Screen Visible',
        text: 'Custom Watermark Text',
        enableUserName: 'Enable User Name Watermark',
        enableTime: 'Show Current Time',
        timeFormat: 'Time Format'
      },
      multilingual: {
        title: 'Multilingual Settings',
        visible: 'Display multilingual button'
      },
      globalSearch: {
        title: 'Global Search Settings',
        visible: 'Display GlobalSearch button'
      }
    },
    configOperation: {
      copyConfig: 'Copy Config',
      copySuccessMsg: 'Copy Success, Please replace the variable "themeSettings" in "src/theme/settings.ts"',
      resetConfig: 'Reset Config',
      resetSuccessMsg: 'Reset Success'
    },
    tablePropsTitle: 'Table Props',
    table: {
      size: {
        title: 'Table Size',
        small: 'Small',
        medium: 'Medium',
        large: 'Large'
      },
      bordered: 'Bordered',
      bottomBordered: 'Bottom Bordered',
      singleColumn: 'Single Column',
      singleLine: 'Single Line',
      striped: 'Striped'
    }
  },
  route: {
    login: 'Login',
    403: 'No Permission',
    404: 'Page Not Found',
    500: 'Server Error',
    'iframe-page': 'Iframe',
    home: 'Home',
    system: 'System Management',
    system_user: 'User Management',
    system_role: 'Role Management',
    system_menu: 'Menu Management',
    system_dept: 'Dept Management',
    system_post: 'Post Management',
    system_dict: 'Dict Management',
    system_config: 'Config Management',
    system_notice: 'Notice Management',
    system_oss: 'File Management',
    'system_oss-config': 'OSS Config',
    system_client: 'Client Management',
    system_tenant: 'Tenant Management',
    'system_tenant-package': 'Tenant Package Management',
    monitor: 'Monitor',
    monitor_logininfor: 'Login Log',
    monitor_operlog: 'Operate Log',
    monitor_cache: 'Cache Monitor',
    monitor_online: 'Online User',
    'user-center': 'User Center',
    'social-callback': 'Social Callback',
    'driver-check-in': 'Driver Check-in',
    demo: 'Demo',
    demo_demo: 'Demo Table',
    demo_tree: 'Demo Tree',
    exception: 'Exception',
    exception_403: '403',
    exception_404: '404',
    exception_500: '500',
    tool: 'System Tools',
    tool_gen: 'Code Generation',
    wms: 'WMS Warehouse',
    'wms_devanning-order': 'Devanning orders',
    wms_inventory: 'Inventory',
    'wms_inventory_warehouse-area': 'Warehouse Areas',
    wms_inventory_location: 'Locations',
    wms_warehouse: 'Warehouse',
    wms_warehouse_settings: 'Warehouse settings',
    wms_warehouse_settings_location: 'Locations',
    'wms_warehouse_settings_warehouse-area': 'Areas',
    'wms_warehouse_settings_putaway-config': 'Put-away rules',
    'wms_warehouse_settings_prelocation-exception-log': 'Pre-location allocation exceptions',
    wms_order: 'Order management',
    'wms_order_devanning-order': 'Devanning orders',
    'wms_order_driver-check-in-record': 'Check-in records',
    'wms_order_park-scheduling': 'Yard scheduling',
    'wms_order_park-management': 'Yard management',
    'wms_order_cargo-inbound-plan': 'Cargo orders',
    'wms_order_import-inventory': 'Import inventory',
    'wms_order_warehouse-inventory-map': 'Inventory floor map',
    'wms_order_inventory-data': 'Inventory data',
    'wms_order_inventory-data-dashboard': 'Inventory & outstock dashboards',
    'wms_order_outstock-data': 'Outstock data',
    'wms_order_outstock-exception': 'Outstock exceptions',
    about: 'About',
    basic: 'Basic Data',
    'basic_platform-warehouse': 'Platform & Warehouses'
  },
  menu: {
    system_tenant: 'Tenant Management',
    system_log: 'Log Management',
    'monitor_snail-job': 'Job Management',
    monitor_admin: 'Admin Monitor'
  },
  dict: {
    sys_user_sex: {
      male: 'Male',
      female: 'Female',
      unknown: 'Unknown'
    },
    sys_show_hide: {
      show: 'Show',
      hide: 'Hide'
    },
    sys_normal_disable: {
      normal: 'Normal',
      disable: 'Disable'
    },
    sys_yes_no: {
      yes: 'Yes',
      no: 'No'
    },
    sys_notice_type: {
      notice: 'Notice',
      announcement: 'Announcement'
    },
    sys_notice_status: {
      normal: 'Normal',
      close: 'Close'
    },
    sys_oper_type: {
      insert: 'Insert',
      update: 'Update',
      delete: 'Delete',
      grant: 'Grant',
      export: 'Export',
      import: 'Import',
      force: 'Force',
      gencode: 'Generate Code',
      clean: 'Clean Data',
      other: 'Other'
    },
    sys_common_status: {
      success: 'Success',
      fail: 'Fail'
    },
    sys_grant_type: {
      password: 'Password Auth',
      sms: 'SMS Auth',
      email: 'Email Auth',
      miniapp: 'Mini App Auth',
      social: 'Social Auth'
    },
    sys_device_type: {
      pc: 'PC',
      android: 'Android',
      ios: 'iOS',
      miniapp: 'Mini App'
    },
    wf_business_status: {
      revoked: 'Revoked',
      draft: 'Draft',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      returned: 'Returned',
      terminated: 'Terminated'
    },
    wf_form_type: {
      custom_form: 'Custom Form',
      dynamic_form: 'Dynamic Form'
    },
    wf_task_status: {
      revoke: 'Revoke',
      pass: 'Pass',
      pending_review: 'Pending Review',
      cancel: 'Cancel',
      return: 'Return',
      terminate: 'Terminate',
      transfer: 'Transfer',
      delegate: 'Delegate',
      copy: 'Copy',
      add_sign: 'Add Sign',
      minus_sign: 'Minus Sign',
      timeout: 'Timeout'
    }
  },
  page: {
    login: {
      common: {
        title: 'Modern enterprise-level multi-tenant management system',
        subTitle: '',
        loginOrRegister: 'Login / Register',
        register: 'Register',
        userNamePlaceholder: 'Please enter user name',
        phonePlaceholder: 'Please enter phone number',
        codePlaceholder: 'Please enter verification code',
        passwordPlaceholder: 'Please enter password',
        confirmPasswordPlaceholder: 'Please enter password again',
        codeLogin: 'Verification code login',
        confirm: 'Confirm',
        back: 'Back',
        validateSuccess: 'Verification passed',
        loginSuccess: 'Login successfully',
        welcomeBack: 'Welcome back, {userName} !'
      },
      pwdLogin: {
        title: 'Password Login',
        rememberMe: 'Remember password',
        forgetPassword: 'Forget password?',
        register: 'Register',
        otherAccountLogin: 'Other Account Login',
        otherLoginMode: 'Other Login Mode',
        superAdmin: 'Super Admin',
        admin: 'Admin',
        user: 'User'
      },
      codeLogin: {
        title: 'Verification Code Login',
        getCode: 'Get verification code',
        reGetCode: 'Reacquire after {time}s',
        sendCodeSuccess: 'Verification code sent successfully',
        imageCodePlaceholder: 'Please enter image verification code'
      },
      register: {
        title: 'Register',
        agreement: 'I have read and agree to',
        protocol: '《User Agreement》',
        policy: '《Privacy Policy》'
      },
      resetPwd: {
        title: 'Reset Password'
      },
      bindWeChat: {
        title: 'Bind WeChat'
      }
    },
    home: {
      branchDesc:
        'For the convenience of everyone in developing and updating the merge, we have streamlined the code of the main branch, only retaining the homepage menu, and the rest of the content has been moved to the example branch for maintenance. The preview address displays the content of the example branch.',
      greeting: 'Good morning, {userName}, today is another day full of vitality!',
      weatherDesc: 'Today is cloudy to clear, 20℃ - 25℃!',
      remainDevanningTasks: 'Remaining unpacking tasks',
      inventoryOccupancy: 'Inventory occupancy',
      estimatedLoading: 'Estimated loading',
      estimatedPickup: 'Estimated container pickup',
      inboundQty: 'Inbound quantity',
      outboundQty: 'Outbound quantity',
      pieSeriesTitle: 'Business mix',
      pieAmazon: 'Amazon',
      pieBen: 'Ben',
      pieDaniuWarehouse: 'Daniu warehouse',
      pieTransferOrder: 'Transfer orders',
      todo: 'Todo',
      message: 'Message',
      downloadCount: 'Download Count',
      registerCount: 'Register Count',
      schedule: 'Work and rest Schedule',
      study: 'Study',
      work: 'Work',
      rest: 'Rest',
      entertainment: 'Entertainment',
      visitCount: 'Visit Count',
      turnover: 'Turnover',
      dealCount: 'Deal Count',
      projectNews: {
        title: 'Project News',
        moreNews: 'More News',
        desc1: 'Soybean created the open source project soybean-admin on May 28, 2021!',
        desc2: 'Yanbowe submitted a bug to soybean-admin, the multi-tab bar will not adapt.',
        desc3: 'Soybean is ready to do sufficient preparation for the release of soybean-admin!',
        desc4: 'Soybean is busy writing project documentation for soybean-admin!',
        desc5: 'Soybean just wrote some of the workbench pages casually, and it was enough to see!'
      },
      creativity: 'Creativity'
    },
    common: {
      id: 'ID',
      createBy: 'Creator',
      createTime: 'Create Time',
      updateBy: 'Updater',
      updateTime: 'Update Time',
      remark: 'Remark',
      form: {
        remark: {
          required: 'Please enter remark',
          invalid: 'Remark cannot be empty'
        }
      }
    },
    system: {
      client: {
        title: 'Client List',
        clientId: 'Client ID',
        clientKey: 'Client Key',
        clientSecret: 'Client Secret',
        grantTypeList: 'Grant Type',
        deviceType: 'Device Type',
        activeTimeout: 'Token Active Timeout',
        timeout: 'Token Timeout',
        status: 'Status',
        form: {
          clientId: {
            required: 'Please enter Client ID',
            invalid: 'Client ID cannot be empty'
          },
          clientKey: {
            required: 'Please enter Client Key',
            invalid: 'Client Key cannot be empty'
          },
          clientSecret: {
            required: 'Please enter Client Secret',
            invalid: 'Client Secret cannot be empty'
          },
          grantTypeList: {
            required: 'Please select Grant Type',
            invalid: 'Grant Type cannot be empty'
          },
          deviceType: {
            required: 'Please select Device Type',
            invalid: 'Device Type cannot be empty'
          },
          activeTimeout: {
            required: 'Please enter Active Timeout',
            invalid: 'Active Timeout cannot be empty',
            tooltip: 'Specify time without operation will expire (unit: second), default 30 minutes (1800 seconds)'
          },
          timeout: {
            required: 'Please enter Timeout',
            invalid: 'Timeout cannot be empty',
            tooltip: 'Specify time will expire (unit: second), default 7 days (604800 seconds)'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          }
        },
        addClient: 'Add Client',
        editClient: 'Edit Client'
      },
      config: {
        title: 'Config List',
        configName: 'Config Name',
        configKey: 'Config Key',
        configValue: 'Config Value',
        configType: 'Built-in',
        remark: 'Remark',
        createTime: 'Create Time',
        refreshCache: 'Refresh Cache',
        refreshCacheSuccess: 'Refresh cache successfully',
        form: {
          configId: {
            required: 'Please enter Config ID',
            invalid: 'Config ID cannot be empty'
          },
          configName: {
            required: 'Please enter Config Name',
            invalid: 'Config Name cannot be empty'
          },
          configKey: {
            required: 'Please enter Config Key',
            invalid: 'Config Key cannot be empty'
          },
          configValue: {
            required: 'Please enter Config Value',
            invalid: 'Config Value cannot be empty'
          },
          configType: {
            required: 'Please select Built-in status',
            invalid: 'Built-in status cannot be empty'
          },
          remark: {
            required: 'Please enter Remark',
            invalid: 'Remark cannot be empty'
          }
        },
        addConfig: 'Add Config',
        editConfig: 'Edit Config'
      },
      dept: {
        empty: 'No department information',
        title: 'Department List',
        parentId: 'Parent Department',
        deptName: 'Department Name',
        orderNum: 'Order Num',
        deptCategory: 'Department Category',
        leader: 'Leader',
        phone: 'Phone',
        email: 'Email',
        status: 'Status',
        sort: 'Sort',
        createTime: 'Create Time',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        form: {
          parentId: {
            required: 'Please select Parent Department',
            invalid: 'Parent Department cannot be empty'
          },
          deptName: {
            required: 'Please enter Department Name',
            invalid: 'Department Name cannot be empty'
          },
          orderNum: {
            required: 'Please enter Order Num',
            invalid: 'Order num cannot be empty'
          },
          deptCategory: {
            required: 'Please enter Department Category',
            invalid: 'Department category cannot be empty'
          },
          leader: {
            required: 'Please enter Leader',
            invalid: 'Leader cannot be empty'
          },
          phone: {
            required: 'Please enter Phone',
            invalid: 'Phone cannot be empty'
          },
          email: {
            required: 'Please enter Email',
            invalid: 'Email cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          sort: {
            required: 'Please enter Sort',
            invalid: 'Sort cannot be empty'
          },
          deptId: {
            required: 'Please enter deptId',
            invalid: 'Dept Id cannot be empty'
          }
        },
        error: {
          getDeptDataFail: 'Get dept data fail',
          getDeptUserDataFail: 'Get dept user data fail'
        },
        placeholder: {
          defaultLeaderPlaceHolder: 'Please select leader',
          addDataLeaderPlaceHolder: 'Department leader can be selected only when updating',
          deptUserIsEmptyLeaderPlaceHolder: 'Current dept has no leader'
        },
        addDept: 'Add Department',
        editDept: 'Edit Department'
      },
      dict: {
        title: 'Dictionary List',
        dictTypeTitle: 'Dictionary Type List',
        dictName: 'Dictionary Name',
        dictType: 'Dictionary Type',
        status: 'Status',
        remark: 'Remark',
        createTime: 'Create Time',
        refreshCacheSuccess: 'Refresh cache successfully',
        refreshCache: 'Refresh Cache',
        confirmDeleteDictType: 'Are you sure you want to delete dic type',
        data: {
          title: 'Dictionary Data List',
          label: 'Dictionary Label',
          value: 'Dictionary Value',
          dictSort: 'Sort',
          isDefault: 'Default',
          listClass: 'Display Style',
          cssClass: 'CSS Class',
          status: 'Status',
          remark: 'Remark',
          createTime: 'Create Time'
        },
        form: {
          dictId: {
            required: 'Please enter Dictionary Id',
            invalid: 'Dictionary Id cannot be empty'
          },
          dictCode: {
            required: 'Please enter Dictionary Code',
            invalid: 'Dictionary Code cannot be empty'
          },
          dictName: {
            required: 'Please enter Dictionary Name',
            invalid: 'Dictionary Name cannot be empty'
          },
          dictType: {
            required: 'Please enter Dictionary Type',
            invalid: 'Dictionary Type cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          remark: {
            required: 'Please enter Remark',
            invalid: 'Remark cannot be empty'
          },
          dictLabel: {
            required: 'Please enter Dictionary Label',
            invalid: 'Dictionary Label cannot be empty'
          },
          dictValue: {
            required: 'Please enter Dictionary Value',
            invalid: 'Dictionary Value cannot be empty'
          },
          dictSort: {
            required: 'Please enter Sort',
            invalid: 'Sort cannot be empty'
          },
          isDefault: {
            required: 'Please select Default',
            invalid: 'Default cannot be empty'
          },
          listClass: {
            required: 'Please select Display Style',
            invalid: 'Display Style cannot be empty'
          },
          cssClass: {
            required: 'Please enter CSS Class',
            invalid: 'CSS Class cannot be empty'
          }
        },
        addDict: 'Add Dictionary',
        editDict: 'Edit Dictionary',
        addDictData: 'Add Dictionary Data',
        editDictData: 'Edit Dictionary Data',
        addDictType: 'Add Dictionary Type',
        editDictType: 'Edit Dictionary Type',
        exportDictType: 'Export Dictionary Type',
        refreshDictType: 'Refresh Dictionary Type',
        dictTypeIsEmpty: 'Dictionary type is empty'
      },
      menu: {
        title: 'Menu List',
        parentId: 'Parent Menu',
        iconType: 'Icon Type',
        menuName: 'Menu Name',
        icon: 'Menu Icon',
        orderNum: 'Sort',
        perms: 'Permission Code',
        component: 'Component Path',
        path: 'Route Path',
        layout: 'Layout',
        externalPath: 'External Path',
        query: 'Route Parameters',
        iframeQuery: 'Iframe Address',
        isFrame: 'External Link',
        isCache: 'Cache',
        menuType: 'Menu Type',
        visible: 'Visible',
        status: 'Status',
        createTime: 'Create Time',
        cache: 'cache',
        noCache: 'No Cache',
        rootName: 'Root',
        buttonPermissionList: 'Button Permission List',
        emptyMenu: 'Empty Menu',
        menuDetail: 'Menu Detail',
        cascadeDeleteContent: 'Cascade delete menu will delete the selected menu and all its sub-menus, are you sure?',
        iconifyTip: 'iconify address：`https://icones.js.org`',
        isFrameTip: 'If you choose External Link, the routing address needs to start with `http(s)://`',
        isCacheTip:
          'If you select yes, it will be cached by `keep-alive`, and the `name` and address of the matching component must be consistent',
        visibleTip: 'If you choose Hide, the route will not appear in the sidebar, but it can still be accessed.',
        statusTip: 'If you choose to disable, the route will not appear in the sidebar and cannot be accessed.',
        permsTip: "Permission string defined in the controller, such as: {'@'}SaCheckPermission('system:user:list')",
        componentTip:
          'The component path to access, such as: `system/user/index`, which is in the `views` directory by default',
        pathTip:
          'Router path，Example：`user`，If the external network address needs to be accessed in the internal link,then  `http(s)://` beginning',
        layoutTip:
          'Default Layout: A layout that includes common sections such as the global header, sidebar, footer, etc;\nBlank Layout: A layout without any common sections, typically used for pages like the login page',
        form: {
          parentId: {
            required: 'Please select Parent Menu',
            invalid: 'Parent Menu cannot be empty'
          },
          menuType: {
            required: 'Please select Menu Type',
            invalid: 'Menu Type cannot be empty'
          },
          icon: {
            required: 'Please select Menu Icon',
            invalid: 'Menu Icon cannot be empty'
          },
          menuIds: {
            required: 'Please select Menu',
            invalid: 'Menu cannot be empty'
          },
          menuName: {
            required: 'Please enter Menu Name',
            invalid: 'Menu Name cannot be empty'
          },
          perms: {
            required: 'Please enter permission code',
            invalid: 'Permission code cannot be empty'
          },
          orderNum: {
            required: 'Please enter order num',
            invalid: 'Order num cannot be empty'
          },
          isFrame: {
            required: 'Please select External Link',
            invalid: 'External Link cannot be empty'
          },
          path: {
            required: 'Please enter Route Path',
            invalid: 'Route Path cannot be empty'
          },
          component: {
            required: 'Please enter Component Path',
            invalid: 'Component Path cannot be empty'
          },
          query: {
            required: 'Please enter Route Parameters',
            invalid: 'Route Parameters cannot be empty'
          },
          isCache: {
            required: 'Please select Cache',
            invalid: 'Cache cannot be empty'
          },
          visible: {
            required: 'Please select Visible',
            invalid: 'Visible cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          permission: {
            required: 'Please enter Permission',
            invalid: 'Permission cannot be empty'
          }
        },
        placeholder: {
          iconifyIconPlaceholder: 'Please enter an icon',
          localIconPlaceholder: 'Please select the local icon',
          queryKey: 'Please enter a key',
          queryValue: 'Please enter a value',
          queryIframe: 'Please enter a iframe address'
        },
        directory: 'Directory',
        menu: 'Menu',
        button: 'Button',
        addMenu: 'Add Menu',
        addChildMenu: 'Add Child Menu',
        editMenu: 'Edit Menu',
        cascadeDelete: 'Cascade Delete Menu'
      },
      notice: {
        title: 'Notice List',
        noticeTitle: 'Notice Title',
        noticeType: 'Notice Type',
        noticeContent: 'Notice Content',
        status: 'Status',
        createTime: 'Create Time',
        form: {
          noticeTitle: {
            required: 'Please enter Notice Title',
            invalid: 'Notice Title cannot be empty'
          },
          noticeType: {
            required: 'Please select Notice Type',
            invalid: 'Notice Type cannot be empty'
          },
          noticeContent: {
            required: 'Please enter Notice Content',
            invalid: 'Notice Content cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          }
        },
        addNotice: 'Add Notice',
        editNotice: 'Edit Notice'
      },
      oss: {
        title: 'File List',
        fileName: 'File Name',
        originalName: 'Original Name',
        fileSuffix: 'File Extension',
        url: 'File URL',
        createTime: 'Create Time',
        service: 'Service Provider',
        form: {
          file: {
            required: 'Please select a file',
            invalid: 'File cannot be empty'
          }
        },
        upload: 'Upload File',
        preview: 'Preview',
        download: 'Download',
        copy: 'Copy Link',
        copySuccess: 'Copy Success'
      },
      ossConfig: {
        title: 'OSS Config List',
        configKey: 'Config Key',
        accessKey: 'Access Key',
        secretKey: 'Secret Key',
        bucketName: 'Bucket Name',
        prefix: 'Prefix',
        endpoint: 'Endpoint',
        domain: 'Custom Domain',
        isHttps: 'HTTPS',
        region: 'Region',
        status: 'Status',
        remark: 'Remark',
        createTime: 'Create Time',
        form: {
          configKey: {
            required: 'Please enter Config Key',
            invalid: 'Config Key cannot be empty'
          },
          accessKey: {
            required: 'Please enter Access Key',
            invalid: 'Access Key cannot be empty'
          },
          secretKey: {
            required: 'Please enter Secret Key',
            invalid: 'Secret Key cannot be empty'
          },
          bucketName: {
            required: 'Please enter Bucket Name',
            invalid: 'Bucket Name cannot be empty'
          },
          prefix: {
            required: 'Please enter Prefix',
            invalid: 'Prefix cannot be empty'
          },
          endpoint: {
            required: 'Please enter Endpoint',
            invalid: 'Endpoint cannot be empty'
          },
          domain: {
            required: 'Please enter Custom Domain',
            invalid: 'Custom Domain cannot be empty'
          },
          isHttps: {
            required: 'Please select HTTPS',
            invalid: 'HTTPS cannot be empty'
          },
          region: {
            required: 'Please enter Region',
            invalid: 'Region cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          remark: {
            required: 'Please enter Remark',
            invalid: 'Remark cannot be empty'
          }
        },
        addOssConfig: 'Add OSS Config',
        editOssConfig: 'Edit OSS Config'
      },
      post: {
        title: 'Post List',
        postCode: 'Post Code',
        postName: 'Post Name',
        postSort: 'Post Sort',
        status: 'Status',
        remark: 'Remark',
        createTime: 'Create Time',
        form: {
          postCode: {
            required: 'Please enter Post Code',
            invalid: 'Post Code cannot be empty'
          },
          postName: {
            required: 'Please enter Post Name',
            invalid: 'Post Name cannot be empty'
          },
          postSort: {
            required: 'Please enter Post Sort',
            invalid: 'Post Sort cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          remark: {
            required: 'Please enter Remark',
            invalid: 'Remark cannot be empty'
          }
        },
        addPost: 'Add Post',
        editPost: 'Edit Post'
      },
      role: {
        title: 'Role List',
        roleName: 'Role Name',
        roleKey: 'Role Key',
        roleSort: 'Role Sort',
        status: 'Status',
        remark: 'Remark',
        menuPermission: 'Menu Permission',
        dataScope: 'Data Scope',
        createTime: 'Create Time',
        form: {
          roleName: {
            required: 'Please enter Role Name',
            invalid: 'Role Name cannot be empty'
          },
          roleKey: {
            required: 'Please enter Role Key',
            invalid: 'Role Key cannot be empty'
          },
          roleSort: {
            required: 'Please enter Role Sort',
            invalid: 'Role Sort cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          remark: {
            required: 'Please enter Remark',
            invalid: 'Remark cannot be empty'
          },
          menuIds: {
            required: 'Please select Menu Permission',
            invalid: 'Menu Permission cannot be empty'
          },
          deptIds: {
            required: 'Please select Dept Permission',
            invalid: 'Dept Permission cannot be empty'
          }
        },
        addRole: 'Add Role',
        editRole: 'Edit Role',
        configPermission: 'Assign Permissions',
        authorizedUsers: 'Assign Users',
        selectMenuPermission: 'Select Menu Permission',
        selectDataScope: 'Select Data Scope',
        selectDeptPermission: 'Select Dept Permission'
      },
      tenant: {
        title: 'Tenant List',
        tenantName: 'Tenant Name',
        tenantId: 'Tenant ID',
        contactUserName: 'Contact Person',
        contactPhone: 'Contact Phone',
        companyName: 'Company Name',
        licenseNumber: 'License Number',
        address: 'Address',
        intro: 'Introduction',
        domain: 'Domain',
        packageId: 'Tenant Package',
        expireTime: 'Expiration Time',
        accountCount: 'Account Count',
        status: 'Status',
        createTime: 'Create Time',
        form: {
          tenantName: {
            required: 'Please enter Tenant Name',
            invalid: 'Tenant Name cannot be empty'
          },
          contactUserName: {
            required: 'Please enter Contact Person',
            invalid: 'Contact Person cannot be empty'
          },
          contactPhone: {
            required: 'Please enter Contact Phone',
            invalid: 'Contact Phone cannot be empty'
          },
          companyName: {
            required: 'Please enter Company Name',
            invalid: 'Company Name cannot be empty'
          },
          licenseNumber: {
            required: 'Please enter License Number',
            invalid: 'License Number cannot be empty'
          },
          address: {
            required: 'Please enter Address',
            invalid: 'Address cannot be empty'
          },
          intro: {
            required: 'Please enter Introduction',
            invalid: 'Introduction cannot be empty'
          },
          domain: {
            required: 'Please enter Domain',
            invalid: 'Domain cannot be empty'
          },
          packageId: {
            required: 'Please select Tenant Package',
            invalid: 'Tenant Package cannot be empty'
          },
          expireTime: {
            required: 'Please select Expiration Time',
            invalid: 'Expiration Time cannot be empty'
          },
          accountCount: {
            required: 'Please enter Account Count',
            invalid: 'Account Count cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          }
        },
        addTenant: 'Add Tenant',
        editTenant: 'Edit Tenant'
      },
      tenantPackage: {
        title: 'Tenant Package List',
        packageName: 'Package Name',
        menuIds: 'Menu Permission',
        remark: 'Remark',
        status: 'Status',
        createTime: 'Create Time',
        form: {
          packageName: {
            required: 'Please enter Package Name',
            invalid: 'Package Name cannot be empty'
          },
          menuIds: {
            required: 'Please select Menu Permission',
            invalid: 'Menu Permission cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          remark: {
            required: 'Please enter Remark',
            invalid: 'Remark cannot be empty'
          }
        },
        addTenantPackage: 'Add Tenant Package',
        editTenantPackage: 'Edit Tenant Package',
        statusChangeSuccess: 'Status modified successfully'
      },
      user: {
        title: 'User List',
        userName: 'Username',
        nickName: 'Nickname',
        deptName: 'Department',
        phonenumber: 'Phone Number',
        status: 'Status',
        createTime: 'Create Time',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        sex: 'Gender',
        roleIds: 'Roles',
        postIds: 'Posts',
        email: 'Email',
        avatar: 'Avatar',
        remark: 'Remark',
        form: {
          userName: {
            required: 'Please enter Username',
            invalid: 'Username cannot be empty'
          },
          nickName: {
            required: 'Please enter Nickname',
            invalid: 'Nickname cannot be empty'
          },
          deptId: {
            required: 'Please select Department',
            invalid: 'Department cannot be empty'
          },
          phonenumber: {
            required: 'Please enter Phone Number',
            invalid: 'Phone Number cannot be empty'
          },
          status: {
            required: 'Please select Status',
            invalid: 'Status cannot be empty'
          },
          password: {
            required: 'Please enter Password',
            invalid: 'Password cannot be empty'
          },
          confirmPassword: {
            required: 'Please enter Confirm Password',
            invalid: 'Confirm Password cannot be empty'
          },
          sex: {
            required: 'Please select Gender',
            invalid: 'Gender cannot be empty'
          },
          roleIds: {
            required: 'Please select Roles',
            invalid: 'Roles cannot be empty'
          },
          postIds: {
            required: 'Please select Posts',
            invalid: 'Posts cannot be empty'
          },
          email: {
            required: 'Please enter Email',
            invalid: 'Email cannot be empty'
          },
          remark: {
            required: 'Please enter Remark',
            invalid: 'Remark cannot be empty'
          }
        },
        addUser: 'Add User',
        editUser: 'Edit User',
        resetPassword: 'Reset Password',
        importUsers: 'Import Users',
        exportTemplate: 'Export Template',
        importSuccess: 'Import successful',
        statusChangeSuccess: 'Status modified successfully'
      }
    },
    basic: {
      platformWarehouse: {
        title: 'Platform & Warehouses',
        addPlatform: 'Add platform',
        addWarehouse: 'Add warehouse',
        platformList: 'Platforms',
        platformSearchPlaceholder: 'Search by name or code',
        platformSearchEmpty: 'No matching platforms — adjust keyword or clear search',
        belongPlatformPlaceholder: 'Select a platform',
        platformName: 'Platform name',
        platformCode: 'Platform code',
        platformIcon: 'Platform icon',
        iconUploadHint: 'PNG/JPG, 100×100 recommended',
        iconUrlPlaceholder: 'Or paste icon URL',
        status: 'Status',
        enabled: 'Enabled',
        disabled: 'Disabled',
        remark: 'Remark',
        belongPlatform: 'Platform',
        warehouseName: 'Warehouse name',
        warehouseCodeCol: 'Warehouse code',
        warehouseCodeHint: 'e.g. AMZ-US-01',
        country: 'Country / region',
        stateProvince: 'State / province',
        city: 'City',
        addressLine: 'Street address',
        addressCol: 'Address',
        postalCode: 'Postal code',
        palletCbm: 'CBM per pallet',
        palletCbmPlaceholder: 'Optional, m³ per pallet',
        createTime: 'Created at',
        searchPlaceholder: 'Code / name',
        statusFilter: 'Status',
        statusAll: 'All',
        countryFilter: 'Country',
        export: 'Export',
        batchEnable: 'Batch enable',
        batchDisable: 'Batch disable',
        disable: 'Disable',
        enable: 'Enable',
        editPlatform: 'Edit platform',
        editWarehouse: 'Edit warehouse',
        warehouseDetail: 'Warehouse detail',
        operateLog: 'Change log',
        noOperateLog: 'No change log yet',
        disablePlatformWarn:
          'There are {count} enabled warehouses. Disabling the platform will disable all of them. Continue?',
        disableWarehouseConfirm: 'Disable warehouse {code}?',
        enableWarehouseConfirm: 'Enable warehouse {code}?',
        clickToCopy: 'Click to copy code',
        copied: 'Copied',
        copyFail: 'Copy failed',
        rule: {
          platformId: 'Please select a platform',
          platformName: 'Please enter platform name',
          platformNameMax: 'Max 30 characters',
          platformCode: 'Please enter platform code',
          platformCodePattern: '3–10 uppercase letters and digits',
          warehouseName: 'Please enter warehouse name',
          warehouseNameMax: 'Max 100 characters',
          warehouseCode: 'Please enter warehouse code',
          warehouseCodePattern: '1–20 uppercase letters, digits, hyphens',
          country: 'Please select country',
          addressLine: 'Please enter street address',
          addressLineMax: 'Max 200 characters'
        },
        importWarehouse: 'Import warehouses',
        importSingleFileHint: 'Upload one Excel (.xls / .xlsx). One warehouse per row.',
        importParsePreview: 'Parse & preview',
        importConfirmSubmit: 'Confirm import',
        importBackToFiles: 'Back',
        importPreviewTitle: 'Import preview ({count} rows)',
        importPreviewHint:
          'Review parsed rows. On confirm, only rows without validation errors are written; error rows are skipped (per backend rules).',
        importPreviewErrorSummary: '{error} row(s) have errors; {valid} row(s) can be submitted.',
        importNeedFile: 'Please choose an Excel file first',
        importPreviewEmpty: 'No rows parsed. Check the file or headers against the template.',
        importNoValidRows: 'No valid rows to import. Fix the spreadsheet and try again.',
        importExcelColumnsTitle: 'Excel columns → fields (match the downloadable template)',
        importExcelColumnsBody: `Col 1 Platform code → platformCode (must match an existing platform)
Col 2 Warehouse code → warehouseCode (also used as warehouse name; persist warehouseName = warehouseCode)
Col 3 Country / region → countryCode (ISO 3166-1 alpha-2, e.g. US, CN)
Col 4 Street address → addressLine
Col 5 City → city (optional)
Col 6 State / province → stateProvince (optional)
Col 7 Postal code → postalCode (optional)
Col 8 CBM per pallet → palletCbm (optional, m³ per pallet)`,
        importColRowNum: 'Row',
        importColError: 'Validation'
      }
    },
    wms: {
      devanningOrder: {
        title: 'Devanning Orders',
        createTimeRange: 'Created time',
        orderTimeRange: 'Order time',
        devanningCompleteTimeRange: 'Devanning completed time',
        expectedDevanningTimeRange: 'Expected devanning time',
        devanningRound: 'Devanning round',
        round1: 'Round 1',
        round2: 'Round 2',
        round3: 'Round 3',
        importOrder: 'Import order',
        importOrderTooltip:
          'Use the V2 template (Download template). Only the second sheet is read; preview uses import-preview/v2. Headers include Carrier, Remark, etc.—see backend.',
        importDispatchStandard: 'Import dispatch (standard)',
        importRawOrder: 'Import raw order sheet',
        importRawOrderBadge: 'Raw delivery sheet (header mapping)',
        importRawOrderMappingTitle: 'Raw delivery spreadsheet notes',
        importRawOrderMappingBody: `Column order does not need to match the downloadable template; the first row must be headers and include columns the server can recognize such as container no. and delivery address (aliases supported; mapped server-side).
Rows are preprocessed (address normalization, UPS merge, CN comma / line breaks for Job/SH, etc.). Use Parse & preview before confirming.
Errors follow backend messages (e.g. missing columns, multiple containers in one file).`,
        importRawOrderNoTemplateHint: 'No system template download required; use your business headers.',
        importRawOrderSheet2Badge: 'Raw order · Sheet 2 (second sheet only)',
        importRawOrderSheet2MappingTitle: 'Raw order Sheet 2 notes',
        importRawOrderSheet2MappingBody: `The workbook must contain a second sheet (single-sheet files will be rejected). Only Sheet 2 is read (backend sheet index 1); carrier / dual-address / non-HOLD same-address merging runs first, then the same preprocessing as “Import raw order sheet”.
The first row must be headers with recognizable container no., delivery address, etc. Use Parse & preview before confirming.`,
        importExcelMappingTitle: 'Delivery spreadsheet columns (parsed by backend)',
        importExcelMappingTitleV2: 'Delivery spreadsheet columns (V2 template · parsed by backend)',
        importMultiHint: 'Multiple workbooks allowed—one order per file; up to {max} files.',
        importParsePreview: 'Parse & preview',
        importConfirmSubmit: 'Confirm import',
        importConfirmSerializeError:
          'Cannot serialize confirm payload (often bad preview data). Close the dialog, upload and preview again; if it persists, copy console logs prefixed with [DevanningImport].',
        importConfirmUnknownError: 'Confirm import failed; see console logs [DevanningImport]',
        importBackToFiles: 'Back',
        importPreviewTitle: 'Import preview ({count} orders)',
        importPreviewHint:
          'Select a container on the right to see master data and inbound lines on the left. Click Confirm when ready.',
        importPreviewPickCoNo: 'Select a container on the right to view details.',
        importPreviewCoList: 'Container / source file',
        importPreviewInboundEditHint:
          'Inbound lines: platform (from master data), warehouse code (dropdown after platform is selected), address type (commercial/private), delivery method, HOLD—double-click a cell to edit. Changes submit with Confirm import.',
        importPreviewNoCoNo: '(No container no.)',
        importNeedFiles: 'Please choose at least one file',
        importPreviewEmpty: 'No orders parsed. Check the file or contact support.',
        doubleClickToEdit: 'Double-click to edit',
        importExcelMappingBody: `Align with business delivery files (e.g. *delivery*.xlsx):
• container → order coNo (same file should use one container / one order)
• Delivery Address → inbound line warehouseCode
• Job No → inbound “order no.” (field systemSoNo); multiple SOs in one cell (line breaks etc.) → normalize to one comma-separated string
• CTNS → totalPieces
• SH ID/MARK → shipmentCode; multiple values → comma-separated like above
• KGS → weight; CBM → volumeCbm
• Remark column → inbound plan remark (line-level; not the order-level remark)
• Hold column: if cell contains substring HOLD (case-insensitive) → hold = true and deliveryMethod = "hold"; else → hold = false and deliveryMethod = "truck_delivery" (values follow dict delivery_type)
• estimatedPalletCount on import: ceil(volumeCbm/2), or 0 if volumeCbm≤0 (same as §5 create rule)
Other master fields may be empty or defaulted by backend if missing; template should match these headers.`,
        importExcelMappingBodyV2: `For **Import order** (Sheet2). Download the **V2 template** (**Carrier**, **Remark** vs **Delivery remark**, etc.—exact columns follow backend).
Preview: **POST .../import-preview/v2** with multipart **files**. Confirm: **POST .../import-confirm**.
Row semantics align with standard dispatch where applicable—backend is source of truth.`,
        newOrder: 'New order',
        createInboundHint:
          'Add inbound plan lines. System pre-location is generated by the system. Estimated pallet count is previewed as ceil(volume CBM ÷ 2); the backend persists using the same rule.',
        addInboundPlanRow: 'Add inbound line',
        estimatedPalletAutoHint: 'Estimated pallets = ceil(volume CBM ÷ 2) (same rule as backend)',
        inboundPlanAtLeastOne: 'Add at least one inbound plan line',
        inboundPlanRowNeedIdentifier: 'Row {index}: enter either Order No. or Shipment code',
        systemPreLocationPending: 'Generated by system',
        statusAll: 'All',
        quickStatus: 'Status filter',
        coNo: 'Container No.',
        orderDate: 'Order date',
        orderDateAutoTip: 'Submit date (same as creation date)',
        blNo: 'B/L No.',
        statusColumn: 'Status',
        attachmentsColumn: 'Attachments',
        attachmentsUpload: 'Upload',
        attachmentsHas: 'Uploaded ({count})',
        attachmentsTitle: 'Attachments',
        attachmentsCollapseTitle: 'Attachments ({count})',
        operationStatusColumn: 'Operation status',
        operationStatusDevanningSheetPrinted: 'Devanning sheet printed',
        operationStatusPalletLabelPrinted: 'Pallet label printed',
        operationStatusInboundReceiptPrinted: 'Inbound receipt printed',
        inboundReceipt: {
          title: 'Inbound receipt',
          modalTitle: 'Print inbound receipt',
          exportMenu: 'Export inbound receipt',
          warehouseCode: 'Warehouse code',
          recommendedLocation: 'Recommended location',
          actualLocation: 'Actual location',
          boxCount: 'Cartons',
          emptyRow: '(No pallets to print)',
          emptyPreview: 'No preview',
          print: 'Print',
          printFailed: 'Could not open print preview. Try again.',
          loadFailed: 'Failed to load inbound receipt data',
          noPallets: 'No printable pallets (estimated pallet count is 0)'
        },
        devanningCompleteTime: 'Devanning completed at',
        expectedDevanningTime: 'Expected devanning',
        inboundWarehouse: 'Inbound warehouse',
        orderLevel: 'Order level',
        devanningStatus: 'Devanning status',
        orderLevelPlaceholder: 'Enter a number',
        queuePosition: 'Queue #',
        devanningDock: 'Devanning dock',
        driverPhone: 'Driver phone',
        driverPhonePlaceholder: 'Enter driver phone',
        labelTag: 'Label',
        cargoQty: 'Cargo qty',
        cargoWeight: 'Cargo weight',
        remarkColumn: 'Remark',
        more: 'More',
        deleteOrder: 'Delete',
        batchOperations: 'Batch actions',
        exportCargoOrders: 'Export cargo orders',
        batchDelete: 'Batch delete',
        batchDeleteNeedSelection: 'Select orders to delete first',
        batchDeleteConfirm:
          'Delete the selected {count} order(s)? Rules are the same as deleting a single order from the row menu.',
        detail: 'Detail',
        exportSheet: 'Export devanning sheet',
        exportFileNamePrefix: 'DevanningSheet',
        exportSheetHint:
          'Use row “More” to export the devanning sheet or pallet labels (Word / ZIP / PDF). Sheet columns match the warehouse template; each label: container on top, warehouse-HOLD-seq in the middle, date at bottom. PDF “Print PDF” does not mark printed; “Download PDF” does.',
        palletLabelWord: 'Pallet labels · Export Word',
        palletLabelZip: 'Pallet labels · Export ZIP',
        palletLabelPdfDirectPrint: 'Pallet labels · Print PDF (quick)',
        palletLabelPdf: 'Pallet labels · Download PDF',
        palletLabelPdfZip: 'Pallet labels · Export PDF (ZIP)',
        palletLabelFilePrefix: 'PalletLabels',
        completeDevanning: 'Complete devanning',
        completeConfirm: 'Mark this order as devanning completed?',
        completeSuccess: 'Success',
        fillRemark: 'Edit remark',
        remarkModalTitle: 'Edit remark',
        remarkPlaceholder: 'Remark (optional)',
        cancelComplete: 'Revert completion',
        cancelCompleteConfirm:
          'Revert devanning-completed status for this order? Final status is defined by backend (e.g. pending devanning).',
        markAbnormal: 'Mark abnormal',
        markAbnormalConfirm: 'Mark this order as abnormal?',
        cancelAbnormal: 'Clear abnormal flag',
        cancelAbnormalConfirm:
          'Clear abnormal status for this order? Restored status is defined by backend (e.g. pending devanning).',
        detailTitle: 'Order detail',
        detailTabBasic: 'Basic info',
        detailTabInbound: 'Inbound plan',
        inboundEditableFieldsHint:
          'Platform (dropdown from maintained list), warehouse code (manual entry without platform; dropdown when platform selected), address type (commercial/private), delivery method, HOLD: double-click to edit; changes save immediately.',
        inboundPlan: {
          summaryTotalPieces: 'Total pieces',
          summaryTotalCbm: 'Total CBM',
          systemPreLocation: 'System pre-location',
          preLocationLine: 'Loc {index}: {location} ({pallets} pallets)',
          preLocationMore: '....',
          outboundStatus: 'Outbound status',
          outboundStatusPending: 'Not shipped',
          outboundStatusDone: 'Shipped',
          editSystemPreLocation: 'Edit system pre-location',
          editSystemPreLocationTitle: 'Edit system pre-location',
          editSystemPreLocationHint:
            'Maintain pre-locations for this inbound line. Use “Add location line” to open the floor plan: clicking a cell opens a pallet count dialog; lines can still be edited or removed. Saving writes the JSON payload.',
          preLocationModalSummaryTitle: 'Inbound plan summary',
          preLocationModalCargoDoc: 'Cargo / documents',
          preLocationAllocatedLinesTitle: 'Allocations (edit codes or pallets)',
          preLocationPickPalletTitle: 'Pallets for this location',
          preLocationPickPalletHint: 'Confirmed rows appear in “Selected” below; you can still edit pallets there.',
          preLocationPickSelectedEditableHint:
            'Selected locations: edit pallets below or delete; click an already-selected cell again to deselect.',
          preLocationCodePlaceholder: 'Location code',
          preLocationPalletPlaceholder: 'Pallets',
          addPreLocationLine: 'Add location line',
          preLocationPickFromMapTitle: 'Pick pre-locations from floor plan',
          preLocationPickFromMapHint:
            'Click an empty cell to enter pallets in a dialog; click a selected cell to deselect. Same color scale as “Warehouse inventory map”.',
          preLocationPickSummaryPrefix: 'Selected: ',
          preLocationPickSummarySegment: '{location}: {count} pallets',
          preLocationPickEmpty: 'None selected. Click a location cell and confirm pallets.',
          preLocationPickZoneFilter: 'Zone filter',
          preLocationPickClickToggle: 'Toggle selection on cell click; colors show occupancy',
          systemSoNo: 'Order No.',
          shipmentCode: 'Shipment code',
          platform: 'Platform',
          warehouseCode: 'Warehouse code',
          addressCol: 'Address',
          addressType: 'Address type',
          addressTypeCommercial: 'Commercial address',
          addressTypePrivate: 'Private address',
          platformUnmatched: 'Unmatched platform',
          deliveryMethod: 'Delivery method',
          totalPieces: 'Pieces',
          weight: 'Weight',
          volumeCbm: 'Volume (CBM)',
          estimatedPalletCount: 'Est. pallet count',
          lineRemark: 'Line remark',
          editTitle: 'Edit inbound plan line',
          holdOn: 'Hold',
          holdOff: 'Release'
        },
        form: {
          coNoRequired: 'Container number is required',
          blNoRequired: 'B/L number is required'
        },
        statusEnum: {
          pending_schedule: 'Pending schedule',
          pending_devanning: 'Pending devanning',
          completed: 'Completed',
          abnormal: 'Abnormal'
        }
      },
      driverCheckInRecord: {
        title: 'Driver check-in records',
        checkedInAt: 'Check-in time',
        checkedInTimeRange: 'Check-in time',
        driverPhone: 'Driver phone',
        driverPhonePlaceholder: 'Driver phone',
        noticeMessage: 'Container {coNo} checked in · driver {driverPhone}',
        noticePanelTitle: 'Notifications',
        noticeSectionCheckIn: 'Check-in',
        noticeSectionOther: 'Other',
        read: 'Read',
        unread: 'Unread',
        readAll: 'Mark all read',
        readAllConfirm: 'Mark all notifications as read?',
        viewAllRecords: 'View all check-in records',
        noPermission: 'No permission. Ask admin for wms:driverCheckInRecord:list'
      },
      parkScheduling: {
        warehouseSelect: 'Warehouse',
        selectWarehouseFirst: 'Select a warehouse first',
        taskPanel: 'Tasks',
        expandTaskPanel: 'Expand task panel',
        collapseTaskPanel: 'Collapse task panel',
        toolbarCollapseTitle: 'Filters, summary & actions',
        createTask: 'New task',
        parkManagement: 'Yard management',
        cabinetReportExportButton: 'Export cabinet schedule',
        cabinetReportTitle: 'Cabinet schedule',
        cabinetReportModalTitle: 'Cabinet schedule · preview & print',
        cabinetReportDateLabel: 'Report date',
        cabinetReportDateHint: 'Header only; table reflects the current board (devanning/loading filter)',
        cabinetReportPrintPdf: 'Print / Save as PDF',
        cabinetReportDockSection: 'Dock',
        cabinetReportEmptyDock: 'No tasks',
        cabinetReportPrintFailed: 'Print could not start. Check your browser and try again.',
        cabinetReportWarehouseIn: 'In warehouse',
        cabinetReportWarehouseNotArrived: 'Not arrived',
        boardEmpty: 'No dock layout yet. Configure docks in Yard management.',
        frontYardDivider: 'Front yard',
        locationAreaUnset: 'Location type not set',
        tabAllWork: 'All',
        tabPendingWork: 'Pending',
        tabInProgressWork: 'In progress',
        tabCompletedWork: 'Completed',
        tabNotArrivedWork: 'Not arrived',
        taskType: 'Task type',
        taskTypeDevanning: 'Devanning',
        taskTypeLoading: 'Loading',
        releaseDockButton: 'Release dock',
        releaseDockModalTitle: 'Release dock',
        releaseDockField: 'Dock',
        releaseDockPlaceholder: 'Type dock name or area (fuzzy match)',
        releaseDockHint:
          'All containers on this dock will be marked completed and the dock cleared (matches task type above).',
        releaseDockPickDock: 'Select or type a matching dock',
        releaseDockConfirm:
          'All containers on dock "{dock}" (about {count}) will be marked completed. Continue?',
        releaseDockSuccess: 'Dock "{dock}" released',
        coNo: 'Container',
        coNoOpenDetailHint: 'Double-click to open devanning order details',
        coNoOpenDetailNoOrder: 'Cannot open details: no linked devanning order',
        columnDock: 'Dock',
        coNoSearchPlaceholder: 'Filter by container, Enter or Search',
        plannedWorkTimeFilter: 'Expected devanning date',
        plannedWorkTimeRangePlaceholder: 'Defaults to today; clear to show all dates',
        coNoBatch: 'Containers (batch)',
        coNoBatchPlaceholder: 'One per line, or separated by comma, semicolon, or space',
        coNoBatchPlaceholderDevanning:
          'Per line: coNo status [veh/vol] [dockNo]. e.g. YMLU9552149 拆柜中 1/30 43 — dockNo fuzzy-matches slot name. 拆柜中 requires dock. Co nos with "-" excluded.',
        coNoBatchParsedWithDock: '; {count} with dock matched',
        coNoBatchParsed: '{count} container(s) recognized',
        coNoBatchParsedDevanning:
          '{count} parsed: 已到待拆 {pending}, not arrived {notArrived}, in progress {inProgress}, inventory update {inventoryUpdate}, completed {completed}',
        coNoBatchParsedWithRatio: '; {count} with vehicles/volume',
        coNoBatchParsedSkipped: '; {count} line(s) skipped (e.g. co no with "-")',
        batchFailure: {
          CO_NO_HYPHEN: 'Container no. contains "-" and is excluded from park scheduling',
          ORDER_NOT_FOUND: 'Devanning order not found or invalid container no.',
          DOCK_NOT_MATCHED: 'Dock code did not match any open devanning dock',
          DOCK_REQUIRED_IN_PROGRESS: '拆柜中 requires a dock (paste dock code or create from a Dock card)'
        },
        batchAutoAssignSummary: 'Auto dock assign ({date}): {assigned} assigned, {skipped} skipped',
        batchAutoAssignTab: 'Dock assign ({count})',
        batchAutoAssignRow: 'Dock {dock}, level {level}',
        batchCreateSuccess: '{count} devanning order(s) updated',
        batchResultButton: 'Task results',
        batchResultTitle: 'Batch task results',
        batchResultSummary: '{success} succeeded, {fail} failed',
        batchResultSuccessTab: 'Success ({count})',
        batchResultFailTab: 'Failed ({count})',
        batchResultAllFailed: 'All failed: no matching sea-container / devanning order, or validation error.',
        batchResultPartial: 'Some containers did not match a devanning order. See failures.',
        batchResultEmpty: 'No batch results yet',
        assignBusinessTypeMismatch: 'Task type does not match dock business type',
        orderLevel: 'Level',
        orderLevelPlaceholder: 'Optional number',
        plannedWorkTime: 'Planned time',
        plannedWorkTimeBegin: 'From',
        plannedWorkTimeEnd: 'To',
        devanningRound: 'Round',
        status: 'Status',
        statusPending: 'Pending',
        statusQueued: 'Queued',
        statusNotArrived: 'Not arrived',
        statusArrivedToQueue: 'Arrived — join queue',
        statusInProgress: 'In progress',
        notArrivedTasks: 'Not arrived (no queue order)',
        noNotArrivedTasks: 'No not-arrived tasks',
        statusCompleted: 'Completed',
        slotEmpty: 'Empty',
        assignSuccess: 'Assigned to dock',
        statusUpdateSuccess: 'Task status updated',
        revertCompletedToPending: 'Move back to pending',
        createTaskDockPresetCurrent:
          'Tasks will be created on dock "{name}" as the current job when that dock has no active job; otherwise use Queue or try again.',
        createTaskDockPresetQueued: 'Tasks will be created on dock "{name}" and placed in the queue.',
        inlinePatchSuccess: 'Saved',
        tableDoubleClickEditHint: 'Double-click to edit; empty values allowed',
        statsTotalTasks: 'Total jobs',
        statsPendingTasks: 'Pending',
        statsCompletedTasks: 'Completed',
        statsDockInProgress: 'In progress at dock',
        dockQueueTitle: 'Dock {name} · queue',
        currentTask: 'Current job',
        queuedTasks: 'Queued jobs',
        taskNo: 'Task No.',
        noCurrentTask: 'No active job',
        noQueuedTasks: 'No queued jobs',
        workSortOrder: 'Work order',
        workSortCurrent: 'Current',
        dockQueueDragHint:
          'Drag a row (avoid the status control); order saves on release. Devanning rounds are PATCHed to match dict order. Queued jobs can be dragged to another dock card.',
        dragToReorder: 'Drag to reorder',
        queueReorderSuccess: 'Queue order saved',
        queueCrossDockTransferSuccess: 'Moved to the other dock queue',
        queueCrossDockConfirm:
          'Move queued job for container 「{coNo}」 to dock 「{toDockName}」? Queue order and devanning rounds will update on both docks; if the source dock has an active job, remaining queue will shift forward.',
        remark: 'Remark',
        form: {
          coNoRequired: 'Container number is required',
          coNoBatchEmpty:
            'Enter at least one valid container (devanning: CO + status, or CO only)',
          coNoBatchSkippedOnly: 'No container parsed — check format (e.g. WHSU6333392 已到待拆)',
          coNoBatchHyphenSkipped: 'Skipped {count} line(s) with "-" in container no. — remove hyphen and retry',
          coNoBatchDockSkipped: 'No valid rows: dock not matched or 拆柜中 missing dock code',
          orderLevelRequired: 'Devanning level is required',
          plannedWorkTimeRequired: 'Planned time is required'
        }
      },
      parkManagement: {
        warehouseSelect: 'Warehouse',
        tabDock: 'Dock',
        tabParking: 'Parking slot',
        slotName: 'Dock name',
        slotType: 'Type',
        businessType: 'Business type',
        businessTypeDevanning: 'Devanning',
        businessTypeLoading: 'Loading',
        locationArea: 'Location type',
        locationAreaPlaceholder: 'Select location type',
        parkingLimit: 'Parking limit',
        sortOrder: 'Sort order',
        parkingLimitPlaceholder: 'Default: 1',
        adjustParkingLimit: 'Adjust parking limit',
        restoreParkingLimitDefault: 'Use default',
        vehicleUnit: ' vehicle(s)',
        yardZone: 'Yard zone',
        yardFront: 'Front yard',
        yardBack: 'Back yard',
        status: 'Status',
        statusOpen: 'Open',
        statusClosed: 'Closed',
        remark: 'Remark',
        addSlot: 'Add dock / slot',
        editSlot: 'Edit dock / slot',
        form: {
          slotNameRequired: 'Name is required',
          businessTypeRequired: 'Business type is required',
          locationAreaRequired: 'Location type is required (board section order follows dict sort)',
          warehouseRequired: 'Warehouse is required'
        }
      },
      cargoInboundPlan: {
        title: 'Cargo orders',
        systemSoNo: 'Order No.',
        locationCode: 'Location',
        zoneCode: 'Zone',
        phaseAll: 'All',
        phaseNotInStock: 'Not received',
        phaseNotInStockHint: 'No pre-location / not in inventory yet',
        phaseInStock: 'In stock',
        phaseInStockHint: 'Has inventory records',
        phaseOutStock: 'Shipped out',
        phaseOutStockHint: 'Outbound completed'
      },
      devanningImportInventory: {
        title: 'Import inventory',
        coNo: 'Container No.',
        blNo: 'B/L No.',
        warehouseCode: 'Warehouse code',
        systemSoNo: 'Order No.',
        shipmentCode: 'Shipment code',
        preLocationCode: 'Pre-location',
        sourceFileName: 'Source file',
        importTime: 'Imported at'
      },
      inventoryData: {
        title: 'Inventory data',
        orderTime: 'Order time',
        devanningCompleteTime: 'Devanning completed at',
        orderNo: 'Order No.',
        coNo: 'Container No.',
        shipmentCode: 'Shipment code',
        zoneCode: 'Zone',
        locationCode: 'Location',
        palletCount: 'Pallets',
        deliveryAddress: 'Delivery Address',
        platform: 'Platform',
        deliveryMethod: 'Delivery method',
        weight: 'Weight',
        volumeCbm: 'Volume',
        totalPieces: 'Pieces',
        remark: 'Remark',
        outstock: 'Outstock',
        manualOutstockTooltip: 'Manual outstock',
        manualOutstockTitle: 'Manual outstock',
        manualOutstockHint:
          'Submit an outstock for this line: all pallets shown on the row are shipped in one step (no quantity input). Backend should align with PDF-based outstock (same or equivalent flow).',
        manualOutstockOutAllNote: 'This will ship all pallets on this line: {count} (same as the pallet count above).',
        manualOutstockSubmit: 'Confirm',
        manualOutstockSuccess: 'Outstock submitted',
        manualOutstockNoPallet: 'Pallet count is 0; cannot outstock.',
        manualOutstockRejected: 'Outstock was rejected; see API message for details.',
        outstockModalTitle: 'Outstock upload',
        outstockModalTip: 'Drag a PDF here, or click to choose a file',
        outstockModalNoticeTitle: 'Notes',
        outstockModalNoticeBody:
          'After upload the system will process outstock; please ensure the PDF matches the order.',
        outstockSubmit: 'Upload',
        outstockNeedFile: 'Please choose a PDF file first',
        editTitle: 'Edit inventory data',
        preLocationPickContextTitle: 'Current inventory line',
        currentLocationCode: 'Current location',
        doubleClickToEditLocation: 'Double-click to pick location on floor plan',
        doubleClickToEditPallet: 'Double-click to edit pallet count',
        preLocationPickNeedExactlyOne: 'Please pick exactly one location before confirming',
        preLocationSyncFailed: 'Inventory updated, but syncing inbound plan pre-locations failed. Refresh and verify.',
        missingInboundPlanForPreLocationSync: 'Missing inbound plan or order id; cannot sync system pre-locations',
        missingInventoryDetailId: 'Missing inventory detail id',
        outstockUploadSuccess: 'PDF uploaded',
        outstockResultTitle: 'Outstock result',
        outstockResultStatus: 'Status',
        outstockResultMessage: 'Notes',
        outstockResultNoDetail: 'Request accepted; no detail rows returned. Verify inventory and documents.',
        outstockBackToUpload: 'Upload again',
        outstockResultDone: 'Done',
        existingImportTitle: 'Import existing inventory',
        existingImportPreviewTitle: 'Import preview ({count} rows)',
        existingImportSubmitImport: 'Submit import',
        existingImportDirectHint:
          'Choose an Excel file and submit; parsing and persistence run on the server. Track progress under Import tasks.',
        existingImportSingleFileHint:
          'Upload one Excel; the server matches container, Job No. (fuzzy to system order no.), and FBA code (= Delivery Address) to skip or create.',
        existingImportNoticeTitle: 'Rules',
        existingImportNoticeBody:
          '1) Skip when the same container + matched order (Job No.) + same FBA code already exists.\n2) Otherwise create the devanning order (sea container) and inbound plan lines (or append only — per backend rules).\n3) List “Order No.” may aggregate multiple lines; Job No. in the sheet must fuzzy-match system SO (backend defines normalization).\n4) Multiple candidates are resolved on the server during async import; see Import tasks for details and errors.',
        existingImportColRowNum: 'Row',
        existingImportColInventoryStatus: 'Inventory status',
        existingImportColRowResultMessage: 'Row result',
        existingImportColJobNo: 'Job No.',
        existingImportColMatchedOrder: 'Matched order',
        existingImportColFba: 'FBA / Delivery',
        existingImportColMatchType: 'Match type',
        existingImportColAction: 'Planned action',
        existingImportColCandidates: 'Candidates',
        existingImportColError: 'Error / note',
        existingImportNeedFile: 'Please choose an Excel file first',
        existingImportPreviewEmpty: 'No data rows parsed',
        existingImportNoValidRows: 'No valid rows to import (fix rows in red)',
        existingImportPreviewHint: 'Review matched order and planned action; confirm persists per backend rules.',
        existingImportPreviewErrorSummary: '{error} row(s) have issues; {valid} row(s) can be imported.',
        existingImportLongRunningWarning:
          'Large files may take a while to parse; do not submit preview twice. After confirm, import runs in the background—use Import tasks to track progress and results.',
        existingImportAccepted: 'Task accepted; importing in the background…',
        existingImportSubmitOk: 'Import task submitted. Track progress and results under Import tasks.',
        existingImportTaskButton: 'Import tasks',
        existingImportTasksModalTitle: 'Import tasks',
        existingImportTasksHint:
          'Async import tasks submitted in this session; cancel while running, view details when finished.',
        existingImportTaskId: 'Task id',
        existingImportTaskStatus: 'Status',
        existingImportTaskSubmittedAt: 'Submitted at',
        existingImportTaskCounts: 'Progress',
        existingImportTaskTotal: 'Total rows',
        existingImportTaskOk: 'OK',
        existingImportTaskFail: 'Failed',
        existingImportTaskDetailTitle: 'Import task detail',
        existingImportTaskView: 'View',
        existingImportTaskInterrupt: 'Cancel',
        existingImportTaskInterruptConfirm:
          'Cancel this import task? Partially processed rows may already be persisted.',
        existingImportTaskCancelSuccess: 'Cancel requested',
        existingImportTaskStatusUnknown: 'Pending sync',
        existingImportTaskStatusSuccess: 'Success',
        existingImportTaskStatusFailed: 'Failed',
        existingImportTaskStatusCancelled: 'Cancelled',
        existingImportTaskStatusPending: 'Queued',
        existingImportTaskStatusRunning: 'Running',
        existingImportTaskRunningTag: 'In progress',
        existingImportTaskUnread: 'Unread results',
        existingImportTaskMarkAllRead: 'Mark all read',
        existingImportTaskResultRows: 'Row results',
        existingImportTaskTabSuccess: 'Success',
        existingImportTaskTabFailed: 'Failed',
        existingImportTaskTabEmpty: 'No rows',
        existingImportTaskDetailFilterInventoryStatus: 'Inventory status',
        existingImportTaskDetailFilterInventoryStatusPh: 'All',
        existingImportTaskNoRows: 'No row-level detail returned (backend may provide resultRows when done).',
        existingImportTaskLoadingStatus: 'Loading task status…',
        existingImportTaskNoErrorDetail: 'No error detail returned; check logs or contact admin.',
        existingImportMissingTaskId: 'Server did not return a task id; cannot track progress.',
        existingImportPollTimeout: 'Timed out waiting for import status; check inventory data later.',
        existingImportPollNetworkError: 'Failed to poll import status; check your network.',
        existingImportAction: {
          skip: 'Skip (exists)',
          create_order_and_plan: 'Create order + plan',
          add_inbound_plan: 'Append inbound plan',
          auto_outbound: 'Auto outstock',
          ambiguous: 'Needs review',
          error: 'Cannot import'
        }
      },
      inventoryDataDashboard: {
        pageHeading: 'Inventory & outstock dashboards',
        title: 'Inventory dashboard',
        hint:
          'Pallets summed by warehouse code (server-side aggregation), sorted descending. Filter params match the Inventory Data list (search UI can be wired later).',
        topCount: 'Warehouses shown',
        presetPlaceholder: 'Quick pick',
        manualPlaceholder: 'Custom 1–500',
        palletCountAxis: 'Pallets (sum)',
        palletCountSeries: 'Pallets (sum)',
        emptyWarehouseCode: '(Empty warehouse code)',
        statsLine:
          '{warehouses} warehouse code(s) under current filters; chart shows the top {shown} returned (by total pallets, descending).',
        loadFailed: 'Failed to load inventory data. Try again later.'
      },
      outstockDataDashboard: {
        title: 'Outstock dashboard',
        hint:
          'Pallet totals by warehouse code (server-side aggregation), sorted descending. Default time filter: create time from one week back through end of today; other list filters can be added later.',
        topCount: 'Warehouses shown',
        presetPlaceholder: 'Quick pick',
        manualPlaceholder: 'Custom 1–500',
        palletCountAxis: 'Pallets (sum)',
        palletCountSeries: 'Pallets (sum)',
        emptyWarehouseCode: '(Empty warehouse code)',
        statsLine:
          '{warehouses} warehouse code(s) under current filters; chart shows the top {shown} returned (by total pallets, descending).',
        loadFailed: 'Failed to load outstock dashboard data. Try again later.'
      },
      outstockData: {
        title: 'Outstock data',
        createTimeRange: 'Created time',
        outstockBatchNo: 'Outstock batch',
        loadingSequenceNo: 'Loading sequence No.',
        coNo: 'Container No.',
        orderNo: 'Order No.',
        shipmentCode: 'Shipment code',
        deliveryAddress: 'Delivery Address',
        platform: 'Platform',
        deliveryMethod: 'Delivery method',
        palletCount: 'Pallets',
        zoneCode: 'Zone',
        locationCode: 'Location',
        weight: 'Weight',
        volumeCbm: 'Volume',
        totalPieces: 'Pieces',
        cancelOutstock: 'Cancel outstock',
        cancelConfirm:
          'Cancel this outstock? The record will be removed; inventory will be restored and inbound plans marked not outstocked.',
        cancelSuccess: 'Cancelled'
      },
      outstockException: {
        title: 'Outstock exceptions',
        outstockBatchNo: 'Outstock batch',
        loadingSequenceNo: 'Loading sequence No.',
        coNo: 'Container No.',
        orderNo: 'Order No.',
        exceptionCount: 'Exceptions',
        lastExceptionTime: 'Last exception at',
        createTime: 'Created at',
        viewDetail: 'Details',
        detailTitle: 'Exception details (batch: {batch})',
        detailTitleFallback: 'Exception details',
        detailOrderNo: 'Order No.',
        detailCoNo: 'Container No.',
        detailFbacode: 'Fbacode',
        exceptionType: 'Type',
        exceptionMessage: 'Message',
        detailTime: 'Time'
      },
      warehouseInventoryMap: {
        title: 'Warehouse inventory visualization',
        zoneAll: 'All zones',
        frameTitle: 'Floor layout',
        cellRemainingAvailable: 'Remaining capacity',
        cellPalletUnit: 'pallets',
        warehouseCodeInventoryEmpty: 'No occupancy by warehouse code',
        noLocations: 'No locations',
        noLocationsInFilter: 'Nothing to show (e.g. all zones hidden via the zone switches).',
        floorPlanVisibility: 'Floor plan',
        mapScale: 'Zoom',
        mapScaleReset: 'Reset',
        mapWrapHint: 'Tiles wrap to the next line within the panel',
        occupancyLegend: 'Utilization',
        occupancyEmpty: 'Empty (0%)',
        occupancyLow: 'Low (1–49%)',
        occupancyModerate: 'Moderate (50–79%)',
        occupancyHigh: 'High (80–94%)',
        occupancyCritical: 'Critical (95%+)',
        occupancyUnknown: 'Invalid capacity',
        collapseAreaSidebar: 'Collapse zone list',
        expandAreaSidebar: 'Expand zone list',
        searchInventoryWarehouseCode: 'Stock warehouse code',
        searchInventoryWarehouseCodePlaceholder: 'e.g. ONT8: locations with that code plus empty locations',
        putawayRuleFilter: 'Putaway rule filter'
      },
      putawayRule: {
        title: 'Put-away rules',
        addRule: 'New rule',
        editRule: 'Edit rule',
        ruleTarget: 'Rule target',
        conditionCombine: 'Combine multiple conditions',
        opAnd: 'AND',
        opOr: 'OR',
        searchAreaName: 'Area name',
        searchLocationCode: 'Location code',
        searchPlatformCode: 'Platform warehouse code',
        putawayPlatformOptional: 'Optional — leave empty to ignore platform',
        targetKindHint:
          'Pick one rule dimension: by area (areas only); by location (areas required, then locations); by type or storage (dict multi-select).',
        targetByArea: 'By warehouse area',
        targetByLocation: 'By location (area + location)',
        locationModeAreaLabel: 'Warehouse area',
        locationModeLocationLabel: 'Location',
        targetByAreaType: 'By area type',
        targetByStorage: 'By storage method',
        multiSelectArea: 'Select one or more areas',
        multiSelectLocation: 'Select one or more locations',
        multiSelectAreaType: 'Select one or more area types',
        multiSelectStorage: 'Select one or more storage methods',
        scopeNeedOneValue: 'Select at least one value for the chosen dimension',
        scopeNeedWarehouseArea: 'When matching by location, select at least one warehouse area',
        dispatchMethodRequired: 'Condition row {index}: delivery method is required',
        fallbackAllocationButton: 'Fallback areas & locations',
        fallbackModalTitle: 'Fallback warehouse areas & locations',
        fallbackHint:
          'When automatic pre-location allocation misses rules or falls back, limit candidates to these areas (and optional locations). Both can be empty (save to disable fallback scope), or use “Clear fallback areas” then save.',
        fallbackAreaLabel: 'Fallback areas',
        fallbackAreaPlaceholder: 'Select one or more warehouse areas',
        fallbackAreaRequired: 'Select at least one warehouse area',
        fallbackClearAreasButton: 'Clear fallback areas',
        fallbackLocationLabel: 'Fallback locations',
        fallbackLocationPlaceholder:
          'Optional. If empty, only areas apply. Locations listed are filtered by selected areas.'
      },
      prelocationExceptionLog: {
        title: 'Pre-location allocation exceptions',
        orderNo: 'Order No.',
        orderNoPlaceholder: 'Inbound plan order no. (e.g. system SO)',
        coNo: 'Container No.',
        coNoPlaceholder: 'Container No.',
        shipmentCode: 'Shipment code',
        shipmentCodePlaceholder: 'Shipment code',
        estimatedPalletCount: 'Estimated pallets',
        exceptionType: 'Exception type',
        exceptionTypePlaceholder: 'Select exception type',
        exceptionReason: 'Reason',
        exceptionReasonKeyword: 'Reason keyword',
        exceptionReasonKeywordPlaceholder: 'Keyword in exception reason',
        logTime: 'Logged at',
        logTimeRange: 'Logged at'
      },
      inventory: {
        warehouseArea: {
          title: 'Warehouse Areas',
          batchOperation: 'Batch',
          addArea: 'New area',
          areaName: 'Area name',
          areaNameCol: 'Area',
          areaType: 'Area type',
          storageMethod: 'Storage method',
          locationMixedStorage: 'Mixed storage in location',
          maxMixedQty: 'Max mixed qty',
          putawayCondition: 'Put-away rules',
          editPutaway: 'Edit put-away rules',
          putawayNotSet: 'Not set',
          putawayPriority: 'Priority',
          putawayDispatchMethod: 'Dispatch method',
          putawayDispatchMethodPlaceholder: 'Select dispatch method',
          putawayPlatform: 'Platform',
          putawayPlatformPlaceholder: 'Select a platform',
          putawayPlatformCodes: 'Platform codes',
          putawayPlatformCodesPlaceholder: 'Enter platform codes',
          putawayPlatformRequired: 'Please select a platform',
          putawayOr: 'OR',
          putawaySummaryPriority: 'Priority {num}',
          putawaySummaryAllCodes: 'Any warehouse code',
          putawaySummaryBetweenRules: '; or ',
          putawaySummaryUnknownPlatform: 'Platform {id}',
          createTime: 'Created at',
          form: {
            areaNameRequired: 'Area name is required',
            maxMixedQtyRequired: 'Max mixed qty is required'
          },
          editArea: 'Edit area'
        },
        location: {
          title: 'Locations',
          areaList: 'Areas',
          allLocations: 'All locations',
          allLocationsHint: 'No area filter; show all locations',
          areaSearchPlaceholder: 'Search by area name',
          expandSearch: 'Expand search',
          collapseSearch: 'Collapse search',
          detailTitle: 'Location detail',
          searchWarehouseArea: 'Warehouse area',
          searchWarehouseAreaPlaceholder: 'Select a warehouse area',
          searchLocationKeyword: 'Location code',
          searchLocationKeywordPlaceholder: 'Fuzzy search by location code',
          addLocation: 'New location',
          editLocation: 'Edit location',
          importLocation: 'Import locations',
          changeStatus: 'Change status',
          zone: 'Zone',
          location: 'Location',
          rowRank: 'Row',
          columnRank: 'Column',
          capacity: 'Capacity',
          currentStock: 'Current stock',
          remainingCapacity: 'Remaining capacity',
          totalPalletCount: 'Total pallets',
          priority: 'Priority',
          status: 'Status',
          statusEnable: 'Batch enable',
          statusDisable: 'Batch disable',
          form: {
            zoneRequired: 'Please select a warehouse area',
            zoneSelectPlaceholder: 'Select a warehouse area',
            locationRequired: 'Location code is required',
            statusRequired: 'Status is required'
          }
        }
      }
    },
    about: {
      title: 'About',
      introduction: `RuoYi-Plus-Soybean is a modern, enterprise-level multi-tenant management system. It combines the powerful backend capabilities of RuoYi-Vue-Plus with the modern frontend features of Soybean Admin.`,
      projectInfo: {
        title: 'Project Info',
        version: 'Version',
        latestBuildTime: 'Latest Build Time',
        documentLink: 'Document Link',
        previewLink: 'Preview Link',
        repositoryLink: 'Repository Link'
      },
      prdDep: 'Production Dependency',
      devDep: 'Development Dependency'
    }
  },
  form: {
    required: 'Cannot be empty',
    userName: {
      required: 'Please enter user name',
      invalid: 'User name format is incorrect'
    },
    phone: {
      required: 'Please enter phone number',
      invalid: 'Phone number format is incorrect'
    },
    pwd: {
      required: 'Please enter password',
      invalid: '6-18 characters, including letters, numbers, and underscores'
    },
    confirmPwd: {
      required: 'Please enter password again',
      invalid: 'The two passwords are inconsistent'
    },
    code: {
      required: 'Please enter verification code',
      invalid: 'Verification code format is incorrect'
    },
    email: {
      required: 'Please enter email',
      invalid: 'Email format is incorrect'
    }
  },
  dropdown: {
    closeCurrent: 'Close Current',
    closeOther: 'Close Other',
    closeLeft: 'Close Left',
    closeRight: 'Close Right',
    closeAll: 'Close All',
    pin: 'Pin Tab',
    unpin: 'Unpin Tab'
  },
  icon: {
    themeConfig: 'Theme Configuration',
    themeSchema: 'Theme Schema',
    lang: 'Switch Language',
    fullscreen: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    reload: 'Reload Page',
    collapse: 'Collapse Menu',
    expand: 'Expand Menu',
    pin: 'Pin',
    unpin: 'Unpin'
  },
  datatable: {
    itemCount: 'Total {total} items',
    fixed: {
      left: 'Left Fixed',
      right: 'Right Fixed',
      unFixed: 'Unfixed'
    }
  }
};

export default local;
