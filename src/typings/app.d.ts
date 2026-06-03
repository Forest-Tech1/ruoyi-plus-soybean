/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** NaiveUI theme overrides that can be specified in preset */
    type NaiveUIThemeOverride = import('naive-ui').GlobalThemeOverrides;

    /** Theme setting */
    interface ThemeSetting {
      /** Theme scheme */
      themeScheme: UnionKey.ThemeScheme;
      /** grayscale mode */
      grayscale: boolean;
      /** colour weakness mode */
      colourWeakness: boolean;
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Theme color */
      themeColor: string;
      /** Theme radius */
      themeRadius: number;
      /** Other color */
      otherColor: OtherColor;
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
      };
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Header */
      header: {
        /** Header height */
        height: number;
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb */
          visible: boolean;
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
        };
        /** Multilingual */
        multilingual: {
          /** Whether to show the multilingual */
          visible: boolean;
        };
        globalSearch: {
          /** Whether to show the GlobalSearch */
          visible: boolean;
        };
      };
      /** Tab */
      tab: {
        /** Whether to show the tab */
        visible: boolean;
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
        /** Whether to close tab by middle click */
        closeTabByMiddleClick: boolean;
      };
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Sider */
      sider: {
        /** Inverted sider */
        inverted: boolean;
        /** Sider width */
        width: number;
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or 'top-hybrid-header-first' */
        mixWidth: number;
        /**
         * Collapsed sider width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or
         * 'top-hybrid-header-first'
         */
        mixCollapsedWidth: number;
        /** Child menu width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or 'top-hybrid-header-first' */
        mixChildMenuWidth: number;
        /** Whether to auto select the first submenu */
        autoSelectFirstMenu: boolean;
      };
      /** Footer */
      footer: {
        /** Whether to show the footer */
        visible: boolean;
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /**
         * Whether float the footer to the right when the layout is 'top-hybrid-sidebar-first' or
         * 'top-hybrid-header-first'
         */
        right: boolean;
      };
      /** Watermark */
      watermark: {
        /** Whether to show the watermark */
        visible: boolean;
        /** Watermark text */
        text: string;
        /** Whether to use user name as watermark text */
        enableUserName: boolean;
        /** Whether to use current time as watermark text */
        enableTime: boolean;
        /** Time format for watermark text */
        timeFormat: string;
      };
      table: {
        /** Whether to show the table border */
        bordered: boolean;
        /** Whether to show the table bottom border */
        bottomBordered: boolean;
        /** Whether to show the table single column */
        singleColumn: boolean;
        /** Whether to show the table single line */
        singleLine: boolean;
        /** Whether to show the table size */
        size: UnionKey.ThemeTableSize;
        /** Whether to show the table striped */
        striped: boolean;
      };
      /** define some theme settings tokens, will transform to css variables */
      tokens: {
        light: ThemeSettingToken;
        dark?: {
          [K in keyof ThemeSettingToken]?: Partial<ThemeSettingToken[K]>;
        };
      };
    }

    interface OtherColor {
      info: string;
      success: string;
      warning: string;
      error: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeSettingTokenColor {
      /** the progress bar color, if not set, will use the primary color */
      nprogress?: string;
      container: string;
      layout: string;
      inverted: string;
      'base-text': string;
    }

    interface ThemeSettingTokenBoxShadow {
      header: string;
      sider: string;
      tab: string;
    }

    interface ThemeSettingToken {
      colors: ThemeSettingTokenColor;
      boxShadow: ThemeSettingTokenBoxShadow;
    }

    type ThemeTokenColor = ThemePaletteColor & ThemeSettingTokenColor;

    /** Theme token CSS variables */
    type ThemeTokenCSSVars = {
      colors: ThemeTokenColor & { [key: string]: string };
      boxShadow: ThemeSettingTokenBoxShadow & { [key: string]: string };
    };
  }

  /** Global namespace */
  namespace Global {
    type VNode = import('vue').VNode;
    type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded;
    type RouteKey = import('@elegant-router/types').RouteKey;
    type RouteMap = import('@elegant-router/types').RouteMap;
    type RoutePath = import('@elegant-router/types').RoutePath;
    type LastLevelRouteKey = import('@elegant-router/types').LastLevelRouteKey;

    /** The router push options */
    type RouterPushOptions = {
      query?: Record<string, string>;
      params?: Record<string, string>;
      force?: boolean;
    };

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
    }

    /** The global menu */
    type Menu = {
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: string;
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The route key */
      routeKey: RouteKey;
      /** The route path */
      routePath: RoutePath;
      /** The menu icon */
      icon?: () => VNode;
      /** The menu children */
      children?: Menu[];
    };

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Pick<RouteLocationNormalizedLoaded, 'name' | 'path' | 'meta'> &
      Partial<Pick<RouteLocationNormalizedLoaded, 'fullPath' | 'query' | 'matched'>>;

    /** The global tab */
    type Tab = {
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
      /** The tab route full path */
      fullPath: string;
      /** The tab fixed index */
      fixedIndex?: number | null;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null;
    };

    /** Form rule */
    type FormRule = import('naive-ui').FormItemRule;

    /** The global dropdown key */
    type DropdownKey = 'closeCurrent' | 'closeOther' | 'closeLeft' | 'closeRight' | 'closeAll' | 'pin' | 'unpin';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@elegant-router/types').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      label: string;
      key: LangType;
    };

    type I18nRouteKey = Exclude<RouteKey, 'root' | 'not-found'>;

    type FormMsg = {
      required: string;
      invalid: string;
      tooltip?: string;
    };

    type Schema = {
      system: {
        title: string;
        updateTitle: string;
        updateContent: string;
        updateConfirm: string;
        updateCancel: string;
      };
      common: {
        action: string;
        add: string;
        addSuccess: string;
        detail: string;
        backToHome: string;
        batchDelete: string;
        import: string;
        export: string;
        importSuccess: string;
        importFail: string;
        importTemplate: string;
        downloadTemplate: string;
        importResult: string;
        importEnd: string;
        importFormat: string;
        importSize: string;
        importTip: string;
        exportSuccess: string;
        exportFail: string;
        updateExisting: string;
        cancel: string;
        close: string;
        check: string;
        selectAll: string;
        expandColumn: string;
        columnSetting: string;
        config: string;
        login: string;
        confirm: string;
        save: string;
        delete: string;
        deleteSuccess: string;
        confirmDelete: string;
        edit: string;
        download: string;
        preview: string;
        name: string;
        status: string;
        warning: string;
        error: string;
        failed: string;
        index: string;
        keywordSearch: string;
        logout: string;
        logoutConfirm: string;
        lookForward: string;
        modify: string;
        modifySuccess: string;
        more: string;
        noData: string;
        operate: string;
        pleaseCheckValue: string;
        refresh: string;
        reset: string;
        search: string;
        switch: string;
        tip: string;
        trigger: string;
        update: string;
        updateSuccess: string;
        saveSuccess: string;
        noChange: string;
        userCenter: string;
        yesOrNo: {
          yes: string;
          no: string;
        };
        second: string;
        selected: string;
        anyRecords: string;
        clear: string;
        noSelectRecord: string;
      };
      request: {
        logout: string;
        logoutMsg: string;
        logoutWithModal: string;
        logoutWithModalMsg: string;
        refreshToken: string;
        tokenExpired: string;
      };
      theme: {
        themeDrawerTitle: string;
        tabs: {
          appearance: string;
          layout: string;
          general: string;
          preset: string;
        };
        appearance: {
          themeSchema: { title: string } & Record<UnionKey.ThemeScheme, string>;
          grayscale: string;
          colourWeakness: string;
          themeColor: {
            title: string;
            followPrimary: string;
          } & Record<Theme.ThemeColorKey, string>;
          recommendColor: string;
          recommendColorDesc: string;
          themeRadius: {
            title: string;
          };
          preset: {
            title: string;
            switchHint: string;
            apply: string;
            applySuccess: string;
            [key: string]:
              | {
                  name: string;
                  desc: string;
                }
              | string;
          };
        };
        layout: {
          layoutMode: { title: string } & Record<UnionKey.ThemeLayoutMode, string> & {
              [K in `${UnionKey.ThemeLayoutMode}_detail`]: string;
            };
          tab: {
            title: string;
            visible: string;
            cache: string;
            cacheTip: string;
            height: string;
            mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
            closeByMiddleClick: string;
            closeByMiddleClickTip: string;
          };
          header: {
            title: string;
            height: string;
            breadcrumb: {
              visible: string;
              showIcon: string;
            };
          };
          sider: {
            title: string;
            inverted: string;
            width: string;
            collapsedWidth: string;
            mixWidth: string;
            mixCollapsedWidth: string;
            mixChildMenuWidth: string;
            autoSelectFirstMenu: string;
            autoSelectFirstMenuTip: string;
          };
          footer: {
            title: string;
            visible: string;
            fixed: string;
            height: string;
            right: string;
          };
          content: {
            title: string;
            scrollMode: { title: string; tip: string } & Record<UnionKey.ThemeScrollMode, string>;
            page: {
              animate: string;
              mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
            };
            fixedHeaderAndTab: string;
          };
        };
        general: {
          title: string;
          watermark: {
            title: string;
            visible: string;
            text: string;
            enableUserName: string;
            enableTime: string;
            timeFormat: string;
          };
          multilingual: {
            title: string;
            visible: string;
          };
          globalSearch: {
            title: string;
            visible: string;
          };
        };
        configOperation: {
          copyConfig: string;
          copySuccessMsg: string;
          resetConfig: string;
          resetSuccessMsg: string;
        };
        tablePropsTitle: string;
        table: {
          size: { title: string } & Record<UnionKey.ThemeTableSize, string>;
          bordered: string;
          bottomBordered: string;
          singleColumn: string;
          singleLine: string;
          striped: string;
        };
      };
      route: Record<I18nRouteKey, string>;
      menu: Record<string, string>;
      dict: Record<string, Record<string, string>>;
      page: {
        common: {
          id: string;
          createBy: string;
          createTime: string;
          updateBy: string;
          updateTime: string;
          remark: string;
          form: {
            remark: FormMsg;
          };
        };
        login: {
          common: {
            title: string;
            subTitle: string;
            loginOrRegister: string;
            register: string;
            userNamePlaceholder: string;
            phonePlaceholder: string;
            codePlaceholder: string;
            passwordPlaceholder: string;
            confirmPasswordPlaceholder: string;
            codeLogin: string;
            confirm: string;
            back: string;
            validateSuccess: string;
            loginSuccess: string;
            welcomeBack: string;
          };
          pwdLogin: {
            title: string;
            rememberMe: string;
            forgetPassword: string;
            register: string;
            otherAccountLogin: string;
            otherLoginMode: string;
            superAdmin: string;
            admin: string;
            user: string;
          };
          codeLogin: {
            title: string;
            getCode: string;
            reGetCode: string;
            sendCodeSuccess: string;
            imageCodePlaceholder: string;
          };
          register: {
            title: string;
            agreement: string;
            protocol: string;
            policy: string;
          };
          resetPwd: {
            title: string;
          };
          bindWeChat: {
            title: string;
          };
        };
        home: {
          branchDesc: string;
          greeting: string;
          weatherDesc: string;
          remainDevanningTasks: string;
          inventoryOccupancy: string;
          estimatedLoading: string;
          estimatedPickup: string;
          inboundQty: string;
          outboundQty: string;
          pieSeriesTitle: string;
          pieAmazon: string;
          pieBen: string;
          pieDaniuWarehouse: string;
          pieTransferOrder: string;
          todo: string;
          message: string;
          downloadCount: string;
          registerCount: string;
          schedule: string;
          study: string;
          work: string;
          rest: string;
          entertainment: string;
          visitCount: string;
          turnover: string;
          dealCount: string;
          projectNews: {
            title: string;
            moreNews: string;
            desc1: string;
            desc2: string;
            desc3: string;
            desc4: string;
            desc5: string;
          };
          creativity: string;
        };
        system: {
          client: {
            title: string;
            clientId: string;
            clientKey: string;
            clientSecret: string;
            grantTypeList: string;
            deviceType: string;
            activeTimeout: string;
            timeout: string;
            status: string;
            form: {
              clientId: FormMsg;
              clientKey: FormMsg;
              clientSecret: FormMsg;
              grantTypeList: FormMsg;
              deviceType: FormMsg;
              activeTimeout: FormMsg;
              timeout: FormMsg;
              status: FormMsg;
            };
            addClient: string;
            editClient: string;
          };
          config: {
            title: string;
            configName: string;
            configKey: string;
            configValue: string;
            configType: string;
            remark: string;
            createTime: string;
            refreshCache: string;
            refreshCacheSuccess: string;
            form: {
              configId: FormMsg;
              configName: FormMsg;
              configKey: FormMsg;
              configValue: FormMsg;
              configType: FormMsg;
              remark: FormMsg;
            };
            addConfig: string;
            editConfig: string;
          };
          dept: {
            empty: string;
            title: string;
            parentId: string;
            deptName: string;
            orderNum: string;
            deptCategory: string;
            leader: string;
            phone: string;
            email: string;
            status: string;
            sort: string;
            createTime: string;
            expandAll: string;
            collapseAll: string;
            form: {
              parentId: FormMsg;
              deptName: FormMsg;
              orderNum: FormMsg;
              deptCategory: FormMsg;
              leader: FormMsg;
              phone: FormMsg;
              email: FormMsg;
              status: FormMsg;
              sort: FormMsg;
              deptId: FormMsg;
            };
            error: {
              getDeptDataFail: string;
              getDeptUserDataFail: string;
            };
            placeholder: {
              defaultLeaderPlaceHolder: string;
              addDataLeaderPlaceHolder: string;
              deptUserIsEmptyLeaderPlaceHolder: string;
            };
            addDept: string;
            editDept: string;
          };
          dict: {
            title: string;
            dictTypeTitle: string;
            dictName: string;
            dictType: string;
            status: string;
            remark: string;
            createTime: string;
            refreshCacheSuccess: string;
            refreshCache: string;
            confirmDeleteDictType: string;
            data: {
              title: string;
              label: string;
              value: string;
              dictSort: string;
              isDefault: string;
              listClass: string;
              cssClass: string;
              status: string;
              remark: string;
              createTime: string;
            };
            form: {
              dictId: FormMsg;
              dictCode: FormMsg;
              dictName: FormMsg;
              dictType: FormMsg;
              status: FormMsg;
              remark: FormMsg;
              dictLabel: FormMsg;
              dictValue: FormMsg;
              dictSort: FormMsg;
              isDefault: FormMsg;
              listClass: FormMsg;
              cssClass: FormMsg;
            };
            addDict: string;
            editDict: string;
            addDictData: string;
            editDictData: string;
            addDictType: string;
            editDictType: string;
            exportDictType: string;
            refreshDictType: string;
            dictTypeIsEmpty: string;
          };
          menu: {
            title: string;
            parentId: string;
            iconType: string;
            menuName: string;
            icon: string;
            orderNum: string;
            perms: string;
            component: string;
            path: string;
            layout: string;
            externalPath: string;
            query: string;
            iframeQuery: string;
            isFrame: string;
            isCache: string;
            menuType: string;
            visible: string;
            status: string;
            createTime: string;
            cache: string;
            noCache: string;
            rootName: string;
            buttonPermissionList: string;
            emptyMenu: string;
            menuDetail: string;
            cascadeDeleteContent: string;
            iconifyTip: string;
            isFrameTip: string;
            isCacheTip: string;
            visibleTip: string;
            statusTip: string;
            permsTip: string;
            componentTip: string;
            pathTip: string;
            layoutTip: string;
            form: {
              parentId: FormMsg;
              menuType: FormMsg;
              menuIds: FormMsg;
              icon: FormMsg;
              menuName: FormMsg;
              orderNum: FormMsg;
              perms: FormMsg;
              isFrame: FormMsg;
              path: FormMsg;
              component: FormMsg;
              query: FormMsg;
              isCache: FormMsg;
              visible: FormMsg;
              status: FormMsg;
              permission: FormMsg;
            };
            placeholder: {
              iconifyIconPlaceholder: string;
              localIconPlaceholder: string;
              queryKey: string;
              queryValue: string;
              queryIframe: string;
            };
            directory: string;
            menu: string;
            button: string;
            addMenu: string;
            addChildMenu: string;
            editMenu: string;
            cascadeDelete: string;
          };
          notice: {
            title: string;
            noticeTitle: string;
            noticeType: string;
            noticeContent: string;
            status: string;
            createTime: string;
            form: {
              noticeTitle: FormMsg;
              noticeType: FormMsg;
              noticeContent: FormMsg;
              status: FormMsg;
            };
            addNotice: string;
            editNotice: string;
          };
          oss: {
            title: string;
            fileName: string;
            originalName: string;
            fileSuffix: string;
            url: string;
            createTime: string;
            service: string;
            form: {
              file: FormMsg;
            };
            upload: string;
            preview: string;
            download: string;
            copy: string;
            copySuccess: string;
          };
          ossConfig: {
            title: string;
            configKey: string;
            accessKey: string;
            secretKey: string;
            bucketName: string;
            prefix: string;
            endpoint: string;
            domain: string;
            isHttps: string;
            region: string;
            status: string;
            remark: string;
            createTime: string;
            form: {
              configKey: FormMsg;
              accessKey: FormMsg;
              secretKey: FormMsg;
              bucketName: FormMsg;
              prefix: FormMsg;
              endpoint: FormMsg;
              domain: FormMsg;
              isHttps: FormMsg;
              region: FormMsg;
              status: FormMsg;
              remark: FormMsg;
            };
            addOssConfig: string;
            editOssConfig: string;
          };
          post: {
            title: string;
            postCode: string;
            postName: string;
            postSort: string;
            status: string;
            remark: string;
            createTime: string;
            form: {
              postCode: FormMsg;
              postName: FormMsg;
              postSort: FormMsg;
              status: FormMsg;
              remark: FormMsg;
            };
            addPost: string;
            editPost: string;
          };
          role: {
            title: string;
            roleName: string;
            roleKey: string;
            roleSort: string;
            status: string;
            remark: string;
            menuPermission: string;
            dataScope: string;
            createTime: string;
            form: {
              roleName: FormMsg;
              roleKey: FormMsg;
              roleSort: FormMsg;
              status: FormMsg;
              remark: FormMsg;
              menuIds: FormMsg;
              deptIds: FormMsg;
            };
            addRole: string;
            editRole: string;
            configPermission: string;
            authorizedUsers: string;
            selectMenuPermission: string;
            selectDataScope: string;
            selectDeptPermission: string;
          };
          tenant: {
            title: string;
            tenantName: string;
            tenantId: string;
            contactUserName: string;
            contactPhone: string;
            companyName: string;
            licenseNumber: string;
            address: string;
            intro: string;
            domain: string;
            packageId: string;
            expireTime: string;
            accountCount: string;
            status: string;
            createTime: string;
            form: {
              tenantName: FormMsg;
              contactUserName: FormMsg;
              contactPhone: FormMsg;
              companyName: FormMsg;
              licenseNumber: FormMsg;
              address: FormMsg;
              intro: FormMsg;
              domain: FormMsg;
              packageId: FormMsg;
              expireTime: FormMsg;
              accountCount: FormMsg;
              status: FormMsg;
            };
            addTenant: string;
            editTenant: string;
          };
          tenantPackage: {
            title: string;
            packageName: string;
            menuIds: string;
            remark: string;
            status: string;
            createTime: string;
            form: {
              packageName: FormMsg;
              menuIds: FormMsg;
              status: FormMsg;
              remark: FormMsg;
            };
            addTenantPackage: string;
            editTenantPackage: string;
            statusChangeSuccess: string;
          };
          user: {
            title: string;
            userName: string;
            nickName: string;
            deptName: string;
            phonenumber: string;
            status: string;
            createTime: string;
            password: string;
            confirmPassword: string;
            sex: string;
            roleIds: string;
            postIds: string;
            email: string;
            avatar: string;
            remark: string;
            form: {
              userName: FormMsg;
              nickName: FormMsg;
              deptId: FormMsg;
              phonenumber: FormMsg;
              status: FormMsg;
              password: FormMsg;
              confirmPassword: FormMsg;
              sex: FormMsg;
              roleIds: FormMsg;
              postIds: FormMsg;
              email: FormMsg;
              remark: FormMsg;
            };
            addUser: string;
            editUser: string;
            resetPassword: string;
            importUsers: string;
            exportTemplate: string;
            importSuccess: string;
            statusChangeSuccess: string;
          };
        };
        basic: {
          platformWarehouse: {
            title: string;
            addPlatform: string;
            addWarehouse: string;
            platformList: string;
            platformSearchPlaceholder: string;
            platformSearchEmpty: string;
            belongPlatformPlaceholder: string;
            platformName: string;
            platformCode: string;
            platformIcon: string;
            iconUploadHint: string;
            iconUrlPlaceholder: string;
            status: string;
            enabled: string;
            disabled: string;
            remark: string;
            belongPlatform: string;
            warehouseName: string;
            warehouseCodeCol: string;
            warehouseCodeHint: string;
            country: string;
            stateProvince: string;
            city: string;
            addressLine: string;
            addressCol: string;
        postalCode: string;
        palletCbm: string;
        palletCbmPlaceholder: string;
        createTime: string;
            searchPlaceholder: string;
            statusFilter: string;
            statusAll: string;
            countryFilter: string;
            export: string;
            batchEnable: string;
            batchDisable: string;
            disable: string;
            enable: string;
            editPlatform: string;
            editWarehouse: string;
            warehouseDetail: string;
            operateLog: string;
            noOperateLog: string;
            disablePlatformWarn: string;
            disableWarehouseConfirm: string;
            enableWarehouseConfirm: string;
            clickToCopy: string;
            copied: string;
            copyFail: string;
            rule: {
              platformId: string;
              platformName: string;
              platformNameMax: string;
              platformCode: string;
              platformCodePattern: string;
              warehouseName: string;
              warehouseNameMax: string;
              warehouseCode: string;
              warehouseCodePattern: string;
              country: string;
              addressLine: string;
              addressLineMax: string;
            };
            importWarehouse: string;
            importSingleFileHint: string;
            importParsePreview: string;
            importConfirmSubmit: string;
            importBackToFiles: string;
            importPreviewTitle: string;
            importPreviewHint: string;
            importPreviewErrorSummary: string;
            importNeedFile: string;
            importPreviewEmpty: string;
            importNoValidRows: string;
            importExcelColumnsTitle: string;
            importExcelColumnsBody: string;
            importColRowNum: string;
            importColError: string;
          };
        };
        wms: {
          devanningOrder: {
            title: string;
            createTimeRange: string;
            orderTimeRange: string;
            devanningCompleteTimeRange: string;
            expectedDevanningTimeRange: string;
            devanningRound: string;
            round1: string;
            round2: string;
            round3: string;
            importOrder: string;
            importOrderTooltip: string;
            importDispatchStandard: string;
            importRawOrder: string;
            importRawOrderBadge: string;
            importRawOrderMappingTitle: string;
            importRawOrderMappingBody: string;
            importRawOrderNoTemplateHint: string;
            importRawOrderSheet2Badge: string;
            importRawOrderSheet2MappingTitle: string;
            importRawOrderSheet2MappingBody: string;
            importExcelMappingTitle: string;
            importExcelMappingTitleV2: string;
            importExcelMappingBody: string;
            importExcelMappingBodyV2: string;
            importMultiHint: string;
            importParsePreview: string;
            importConfirmSubmit: string;
            importConfirmSerializeError: string;
            importConfirmUnknownError: string;
            importBackToFiles: string;
            importPreviewTitle: string;
            importPreviewHint: string;
            importPreviewPickCoNo: string;
            importPreviewCoList: string;
            /** 拆柜订单列表：更多 → 导出货物订单 */
            exportCargoOrders: string;
            /** 导入预览入库计划表格：双击可改字段提示 */
            importPreviewInboundEditHint: string;
            importPreviewNoCoNo: string;
            importNeedFiles: string;
            importPreviewEmpty: string;
            doubleClickToEdit: string;
            newOrder: string;
            createInboundHint: string;
            addInboundPlanRow: string;
            estimatedPalletAutoHint: string;
            inboundPlanAtLeastOne: string;
            inboundPlanRowNeedIdentifier: string;
            systemPreLocationPending: string;
            statusAll: string;
            quickStatus: string;
            coNo: string;
            orderDate: string;
            orderDateAutoTip: string;
            blNo: string;
            statusColumn: string;
            attachmentsColumn: string;
            attachmentsUpload: string;
            attachmentsHas: string;
            attachmentsTitle: string;
            attachmentsCollapseTitle: string;
            operationStatusColumn: string;
            operationStatusDevanningSheetPrinted: string;
            operationStatusPalletLabelPrinted: string;
            operationStatusInboundReceiptPrinted: string;
            inboundReceipt: {
              title: string;
              modalTitle: string;
              exportMenu: string;
              warehouseCode: string;
              recommendedLocation: string;
              actualLocation: string;
              boxCount: string;
              emptyRow: string;
              emptyPreview: string;
              print: string;
              printFailed: string;
              loadFailed: string;
              noPallets: string;
            };
            devanningCompleteTime: string;
            expectedDevanningTime: string;
            inboundWarehouse: string;
            orderLevel: string;
            devanningStatus: string;
            orderLevelPlaceholder: string;
            queuePosition: string;
            devanningDock: string;
            labelTag: string;
            cargoQty: string;
            cargoWeight: string;
            remarkColumn: string;
            more: string;
            deleteOrder: string;
            batchOperations: string;
            batchDelete: string;
            batchDeleteNeedSelection: string;
            batchDeleteConfirm: string;
            detail: string;
            exportSheet: string;
            exportFileNamePrefix: string;
            exportSheetHint: string;
            palletLabelWord: string;
            palletLabelZip: string;
            palletLabelPdfDirectPrint: string;
            palletLabelPdf: string;
            palletLabelPdfZip: string;
            palletLabelFilePrefix: string;
            completeDevanning: string;
            completeConfirm: string;
            completeSuccess: string;
            fillRemark: string;
            remarkModalTitle: string;
            remarkPlaceholder: string;
            cancelComplete: string;
            cancelCompleteConfirm: string;
            markAbnormal: string;
            markAbnormalConfirm: string;
            cancelAbnormal: string;
            cancelAbnormalConfirm: string;
            detailTitle: string;
            detailTabBasic: string;
            detailTabInbound: string;
            /** 详情/入库计划表格：就地编辑提示 */
            inboundEditableFieldsHint: string;
            inboundPlan: {
              summaryTotalPieces: string;
              summaryTotalCbm: string;
              systemPreLocation: string;
              preLocationLine: string;
              preLocationMore: string;
              outboundStatus: string;
              outboundStatusPending: string;
              outboundStatusDone: string;
              editSystemPreLocation: string;
              editSystemPreLocationTitle: string;
              editSystemPreLocationHint: string;
              preLocationModalSummaryTitle: string;
              preLocationModalCargoDoc: string;
              preLocationAllocatedLinesTitle: string;
              preLocationPickPalletTitle: string;
              preLocationPickPalletHint: string;
              preLocationPickSelectedEditableHint: string;
              preLocationCodePlaceholder: string;
              preLocationPalletPlaceholder: string;
              addPreLocationLine: string;
              preLocationPickFromMapTitle: string;
              preLocationPickFromMapHint: string;
              preLocationPickSummaryPrefix: string;
              preLocationPickSummarySegment: string;
              preLocationPickEmpty: string;
              preLocationPickZoneFilter: string;
              preLocationPickClickToggle: string;
              systemSoNo: string;
              shipmentCode: string;
              platform: string;
              warehouseCode: string;
              /** 入库计划「地址」列（字段仍为 addressType） */
              addressCol: string;
              addressType: string;
              addressTypeCommercial: string;
              addressTypePrivate: string;
              platformUnmatched: string;
              deliveryMethod: string;
              totalPieces: string;
              weight: string;
              volumeCbm: string;
              estimatedPalletCount: string;
              lineRemark: string;
              editTitle: string;
              holdOn: string;
              holdOff: string;
            };
            form: {
              coNoRequired: string;
              blNoRequired: string;
            };
            statusEnum: {
              pending_schedule: string;
              pending_devanning: string;
              completed: string;
              abnormal: string;
            };
          };
          driverCheckInRecord: {
            title: string;
            checkedInAt: string;
            checkedInTimeRange: string;
            driverPhone: string;
            driverPhonePlaceholder: string;
            noticeMessage: string;
            noticePanelTitle: string;
            noticeSectionCheckIn: string;
            noticeSectionOther: string;
            read: string;
            unread: string;
            readAll: string;
            readAllConfirm: string;
            viewAllRecords: string;
            noPermission: string;
          };
          parkScheduling: {
            warehouseSelect: string;
            selectWarehouseFirst: string;
            taskPanel: string;
            expandTaskPanel: string;
            collapseTaskPanel: string;
            toolbarCollapseTitle: string;
            createTask: string;
            parkManagement: string;
            cabinetReportExportButton: string;
            cabinetReportTitle: string;
            cabinetReportModalTitle: string;
            cabinetReportDateLabel: string;
            cabinetReportDateHint: string;
            cabinetReportPrintPdf: string;
            cabinetReportDockSection: string;
            cabinetReportEmptyDock: string;
            cabinetReportPrintFailed: string;
            cabinetReportWarehouseIn: string;
            cabinetReportWarehouseNotArrived: string;
            boardEmpty: string;
            frontYardDivider: string;
            locationAreaUnset: string;
            tabAllWork: string;
            tabPendingWork: string;
            tabInProgressWork: string;
            tabCompletedWork: string;
            tabNotArrivedWork: string;
            taskType: string;
            taskTypeDevanning: string;
            taskTypeLoading: string;
            coNo: string;
            coNoOpenDetailHint: string;
            coNoOpenDetailNoOrder: string;
            columnDock: string;
            coNoSearchPlaceholder: string;
            plannedWorkTimeFilter: string;
            plannedWorkTimeRangePlaceholder: string;
            coNoBatch: string;
            coNoBatchPlaceholder: string;
            coNoBatchPlaceholderDevanning: string;
            coNoBatchParsed: string;
            coNoBatchParsedDevanning: string;
            batchCreateSuccess: string;
            batchResultButton: string;
            batchResultTitle: string;
            batchResultSummary: string;
            batchResultSuccessTab: string;
            batchResultFailTab: string;
            batchResultAllFailed: string;
            batchResultPartial: string;
            batchResultEmpty: string;
            assignBusinessTypeMismatch: string;
            orderLevel: string;
            orderLevelPlaceholder: string;
            plannedWorkTime: string;
            plannedWorkTimeBegin: string;
            plannedWorkTimeEnd: string;
            devanningRound: string;
            status: string;
            statusPending: string;
            statusQueued: string;
            statusNotArrived: string;
            statusArrivedToQueue: string;
            statusInProgress: string;
            statusCompleted: string;
            slotEmpty: string;
            assignSuccess: string;
            statusUpdateSuccess: string;
            revertCompletedToPending: string;
            createTaskDockPresetCurrent: string;
            createTaskDockPresetQueued: string;
            inlinePatchSuccess: string;
            tableDoubleClickEditHint: string;
            statsTotalTasks: string;
            statsPendingTasks: string;
            statsCompletedTasks: string;
            statsDockInProgress: string;
            dockQueueTitle: string;
            currentTask: string;
            queuedTasks: string;
            notArrivedTasks: string;
            noNotArrivedTasks: string;
            taskNo: string;
            noCurrentTask: string;
            noQueuedTasks: string;
            workSortOrder: string;
            workSortCurrent: string;
            dockQueueDragHint: string;
            dragToReorder: string;
            queueReorderSuccess: string;
            queueCrossDockTransferSuccess: string;
            queueCrossDockConfirm: string;
            remark: string;
            form: {
              coNoRequired: string;
              coNoBatchEmpty: string;
              orderLevelRequired: string;
              plannedWorkTimeRequired: string;
            };
          };
          parkManagement: {
            warehouseSelect: string;
            tabDock: string;
            tabParking: string;
            slotName: string;
            slotType: string;
            businessType: string;
            businessTypeDevanning: string;
            businessTypeLoading: string;
            locationArea: string;
            locationAreaPlaceholder: string;
            parkingLimit: string;
            sortOrder: string;
            parkingLimitPlaceholder: string;
            adjustParkingLimit: string;
            restoreParkingLimitDefault: string;
            vehicleUnit: string;
            yardZone: string;
            yardFront: string;
            yardBack: string;
            status: string;
            statusOpen: string;
            statusClosed: string;
            remark: string;
            addSlot: string;
            editSlot: string;
            form: {
              slotNameRequired: string;
              businessTypeRequired: string;
              locationAreaRequired: string;
              warehouseRequired: string;
            };
          };
          cargoInboundPlan: {
            title: string;
            systemSoNo: string;
            locationCode: string;
            zoneCode: string;
            phaseAll: string;
            phaseNotInStock: string;
            phaseNotInStockHint: string;
            phaseInStock: string;
            phaseInStockHint: string;
            phaseOutStock: string;
            phaseOutStockHint: string;
          };
          devanningImportInventory: {
            title: string;
            coNo: string;
            blNo: string;
            warehouseCode: string;
            systemSoNo: string;
            shipmentCode: string;
            preLocationCode: string;
            sourceFileName: string;
            importTime: string;
          };
          inventoryData: {
            title: string;
            orderTime: string;
            devanningCompleteTime: string;
            orderNo: string;
            coNo: string;
            shipmentCode: string;
            zoneCode: string;
            locationCode: string;
            palletCount: string;
            deliveryAddress: string;
            platform: string;
            deliveryMethod: string;
            weight: string;
            volumeCbm: string;
            totalPieces: string;
            remark: string;
            outstock: string;
            manualOutstockTooltip: string;
            manualOutstockTitle: string;
            manualOutstockHint: string;
            manualOutstockOutAllNote: string;
            manualOutstockSubmit: string;
            manualOutstockSuccess: string;
            manualOutstockNoPallet: string;
            manualOutstockRejected: string;
            outstockModalTitle: string;
            outstockModalTip: string;
            outstockModalNoticeTitle: string;
            outstockModalNoticeBody: string;
            outstockSubmit: string;
            outstockNeedFile: string;
            editTitle: string;
            preLocationPickContextTitle: string;
            currentLocationCode: string;
            doubleClickToEditLocation: string;
            doubleClickToEditPallet: string;
            preLocationPickNeedExactlyOne: string;
            preLocationSyncFailed: string;
            missingInboundPlanForPreLocationSync: string;
            missingInventoryDetailId: string;
            outstockUploadSuccess: string;
            outstockResultTitle: string;
            outstockResultStatus: string;
            outstockResultMessage: string;
            outstockResultNoDetail: string;
            outstockBackToUpload: string;
            outstockResultDone: string;
            existingImportTitle: string;
            existingImportPreviewTitle: string;
            existingImportSubmitImport: string;
            existingImportDirectHint: string;
            existingImportSingleFileHint: string;
            existingImportNoticeTitle: string;
            existingImportNoticeBody: string;
            existingImportColRowNum: string;
            existingImportColInventoryStatus: string;
            existingImportColRowResultMessage: string;
            existingImportColJobNo: string;
            existingImportColMatchedOrder: string;
            existingImportColFba: string;
            existingImportColMatchType: string;
            existingImportColAction: string;
            existingImportColCandidates: string;
            existingImportColError: string;
            existingImportNeedFile: string;
            existingImportPreviewEmpty: string;
            existingImportNoValidRows: string;
            existingImportPreviewHint: string;
            existingImportPreviewErrorSummary: string;
            existingImportLongRunningWarning: string;
            existingImportAccepted: string;
            existingImportSubmitOk: string;
            existingImportTaskButton: string;
            existingImportTasksModalTitle: string;
            existingImportTasksHint: string;
            existingImportTaskId: string;
            existingImportTaskStatus: string;
            existingImportTaskSubmittedAt: string;
            existingImportTaskCounts: string;
            existingImportTaskTotal: string;
            existingImportTaskOk: string;
            existingImportTaskFail: string;
            existingImportTaskDetailTitle: string;
            existingImportTaskView: string;
            existingImportTaskInterrupt: string;
            existingImportTaskInterruptConfirm: string;
            existingImportTaskCancelSuccess: string;
            existingImportTaskStatusUnknown: string;
            existingImportTaskStatusSuccess: string;
            existingImportTaskStatusFailed: string;
            existingImportTaskStatusCancelled: string;
            existingImportTaskStatusPending: string;
            existingImportTaskStatusRunning: string;
            existingImportTaskRunningTag: string;
            existingImportTaskUnread: string;
            existingImportTaskMarkAllRead: string;
            existingImportTaskResultRows: string;
            existingImportTaskTabSuccess: string;
            existingImportTaskTabFailed: string;
            existingImportTaskTabEmpty: string;
            existingImportTaskDetailFilterInventoryStatus: string;
            existingImportTaskDetailFilterInventoryStatusPh: string;
            existingImportTaskNoRows: string;
            existingImportTaskLoadingStatus: string;
            existingImportTaskNoErrorDetail: string;
            existingImportMissingTaskId: string;
            existingImportPollTimeout: string;
            existingImportPollNetworkError: string;
            existingImportAction: {
              skip: string;
              create_order_and_plan: string;
              add_inbound_plan: string;
              auto_outbound: string;
              ambiguous: string;
              error: string;
            };
          };
          inventoryDataDashboard: {
            pageHeading: string;
            title: string;
            hint: string;
            topCount: string;
            presetPlaceholder: string;
            manualPlaceholder: string;
            palletCountAxis: string;
            palletCountSeries: string;
            emptyWarehouseCode: string;
            statsLine: string;
            loadFailed: string;
          };
          outstockDataDashboard: {
            title: string;
            hint: string;
            topCount: string;
            presetPlaceholder: string;
            manualPlaceholder: string;
            palletCountAxis: string;
            palletCountSeries: string;
            emptyWarehouseCode: string;
            statsLine: string;
            loadFailed: string;
          };
          outstockData: {
            title: string;
            createTimeRange: string;
            outstockBatchNo: string;
            loadingSequenceNo: string;
            coNo: string;
            orderNo: string;
            shipmentCode: string;
            deliveryAddress: string;
            platform: string;
            deliveryMethod: string;
            palletCount: string;
            zoneCode: string;
            locationCode: string;
            weight: string;
            volumeCbm: string;
            totalPieces: string;
            cancelOutstock: string;
            cancelConfirm: string;
            cancelSuccess: string;
          };
          outstockException: {
            title: string;
            outstockBatchNo: string;
            loadingSequenceNo: string;
            coNo: string;
            orderNo: string;
            exceptionCount: string;
            lastExceptionTime: string;
            createTime: string;
            viewDetail: string;
            detailTitle: string;
            detailTitleFallback: string;
            detailOrderNo: string;
            detailCoNo: string;
            detailFbacode: string;
            exceptionType: string;
            exceptionMessage: string;
            detailTime: string;
          };
          warehouseInventoryMap: {
            title: string;
            zoneAll: string;
            frameTitle: string;
            cellRemainingAvailable: string;
            cellPalletUnit: string;
            warehouseCodeInventoryEmpty: string;
            noLocations: string;
            noLocationsInFilter: string;
            floorPlanVisibility: string;
            mapScale: string;
            mapScaleReset: string;
            mapWrapHint: string;
            occupancyLegend: string;
            occupancyEmpty: string;
            occupancyLow: string;
            occupancyModerate: string;
            occupancyHigh: string;
            occupancyCritical: string;
            occupancyUnknown: string;
            collapseAreaSidebar: string;
            expandAreaSidebar: string;
            searchInventoryWarehouseCode: string;
            searchInventoryWarehouseCodePlaceholder: string;
            putawayRuleFilter: string;
          };
          putawayRule: {
            title: string;
            addRule: string;
            editRule: string;
            ruleTarget: string;
            conditionCombine: string;
            opAnd: string;
            opOr: string;
            searchAreaName: string;
            searchLocationCode: string;
            searchPlatformCode: string;
            putawayPlatformOptional: string;
            targetKindHint: string;
            targetByArea: string;
            targetByLocation: string;
            locationModeAreaLabel: string;
            locationModeLocationLabel: string;
            targetByAreaType: string;
            targetByStorage: string;
            multiSelectArea: string;
            multiSelectLocation: string;
            multiSelectAreaType: string;
            multiSelectStorage: string;
            scopeNeedOneValue: string;
            scopeNeedWarehouseArea: string;
            dispatchMethodRequired: string;
            fallbackAllocationButton: string;
            fallbackModalTitle: string;
            fallbackHint: string;
            fallbackAreaLabel: string;
            fallbackAreaPlaceholder: string;
            fallbackAreaRequired: string;
            fallbackClearAreasButton: string;
            fallbackLocationLabel: string;
            fallbackLocationPlaceholder: string;
          };
          prelocationExceptionLog: {
            title: string;
            orderNo: string;
            orderNoPlaceholder: string;
            coNo: string;
            coNoPlaceholder: string;
            shipmentCode: string;
            shipmentCodePlaceholder: string;
            estimatedPalletCount: string;
            exceptionType: string;
            exceptionTypePlaceholder: string;
            exceptionReason: string;
            exceptionReasonKeyword: string;
            exceptionReasonKeywordPlaceholder: string;
            logTime: string;
            logTimeRange: string;
          };
          inventory: {
            warehouseArea: {
              title: string;
              batchOperation: string;
              addArea: string;
              areaName: string;
              areaNameCol: string;
              areaType: string;
              storageMethod: string;
              locationMixedStorage: string;
              maxMixedQty: string;
              putawayCondition: string;
              editPutaway: string;
              putawayNotSet: string;
              putawayPriority: string;
              putawayDispatchMethod: string;
              putawayDispatchMethodPlaceholder: string;
              putawayPlatform: string;
              putawayPlatformPlaceholder: string;
              putawayPlatformCodes: string;
              putawayPlatformCodesPlaceholder: string;
              putawayPlatformRequired: string;
              putawayOr: string;
              putawaySummaryPriority: string;
              putawaySummaryAllCodes: string;
              putawaySummaryBetweenRules: string;
              putawaySummaryUnknownPlatform: string;
              createTime: string;
              form: {
                areaNameRequired: string;
                maxMixedQtyRequired: string;
              };
              editArea: string;
            };
            location: {
              title: string;
              areaList: string;
              allLocations: string;
              allLocationsHint: string;
              areaSearchPlaceholder: string;
              expandSearch: string;
              collapseSearch: string;
              detailTitle: string;
              searchWarehouseArea: string;
              searchWarehouseAreaPlaceholder: string;
              searchLocationKeyword: string;
              searchLocationKeywordPlaceholder: string;
              addLocation: string;
              editLocation: string;
              importLocation: string;
              changeStatus: string;
              zone: string;
              location: string;
              rowRank: string;
              columnRank: string;
              capacity: string;
              currentStock: string;
              remainingCapacity: string;
              totalPalletCount: string;
              priority: string;
              status: string;
              statusEnable: string;
              statusDisable: string;
              form: {
                zoneRequired: string;
                zoneSelectPlaceholder: string;
                locationRequired: string;
                statusRequired: string;
              };
            };
          };
        };
        about: {
          title: string;
          introduction: string;
          projectInfo: {
            title: string;
            version: string;
            latestBuildTime: string;
            documentLink: string;
            previewLink: string;
            repositoryLink: string;
          };
          prdDep: string;
          devDep: string;
        };
      };
      form: {
        required: string;
        userName: FormMsg;
        phone: FormMsg;
        pwd: FormMsg;
        confirmPwd: FormMsg;
        code: FormMsg;
        email: FormMsg;
      };
      dropdown: Record<Global.DropdownKey, string>;
      icon: {
        themeConfig: string;
        themeSchema: string;
        lang: string;
        fullscreen: string;
        fullscreenExit: string;
        reload: string;
        collapse: string;
        expand: string;
        pin: string;
        unpin: string;
      };
      datatable: {
        itemCount: string;
        fixed: {
          left: string;
          right: string;
          unFixed: string;
        };
      };
    };

    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${GetI18nKey<T[K]>}`
        : K
      : never;

    type I18nKey = GetI18nKey<Schema>;

    type TranslateOptions<Locales extends string> = import('vue-i18n').TranslateOptions<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }

  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
      ws?: boolean;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      code: string;
      /** The backend service response message */
      msg: string;
      /** The backend service response data */
      data: T;
      rows?: any[];
      total?: number;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
    };
  }
}
