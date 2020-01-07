var tvModule = angular.module("ThingView", ['tree'])
.constant('MODULE_VERSION', '0.0.1')
.factory("factory", function() {});

tvModule.value('appName', 'ThingViewApp');

tvModule.controller("ThingViewController", function($scope, $timeout, $interval, $rootScope) {
    $scope.progress = 0;
    $scope.timer = null;
    $scope.delayApply = null;
    $scope.app = "";
    $scope.session = "";
    $scope.viewType;
    $scope.viewExtension = "";
    $scope.view3D = true;
    $scope.currentArrayBuffer = null;
    $scope.currentDocument = null;
    $scope.currentPageNo = 1;
    $scope.totalPageNo = 1;
    $scope.sessionId = "";
    $scope.modelParams = { "url":"", "baseUrl":"", "templateUrl":"", "mapUrl":"", "getmarkupUrl":""}
    $scope.viewLocation = { "position": { "x":0.0, "y":0.0, "z":0.0 }, "orientation": { "x":0.0, "y":0.0, "z":0.0 } };
    $scope.viewLocationSet = 'NO';
    $scope.viewStates = [];
    $scope.viewOrients = [];
    $scope.orthoProjection = false;
    $scope.viewablesModelDisplay = true;
    $scope.viewablesFiguresDisplay = true;
    $scope.viewablesDocumentsDisplay = true;
    $scope.modelLocation;
    $scope.annotationSets = [];
    $scope.annotationSetSelector = "";
    $scope.viewablesData = [];
    $scope.documentSelector = "";
    $scope.illustrations = [];
    $scope.loadedIllustration = "-";
    $scope.playall = false;
    $scope.itemslist = [];
    $scope.contextMenuType = "";
    $scope.showFeatureMarkups = true;
    $scope.showFeatureFaces = false;
    $scope.autoSpinCenter = false;

    $scope.hasAnimation = false;
    $scope.hasSequence = false;

    $scope.documentScene;
    $scope.isPDF = false;

    $scope.activePrimaryPane = "structure";
    $scope.activeSecondaryPane = "modelAnnotations";
    $scope.activeBottomPane = "properties";
    $scope.availableDataSets = [];
    $scope.availablePVSUrls = [];
    $scope.availableModels = [];
    $scope.pvsBaseUrl = "";
    $scope.pvsUrl = "";

    $scope.showPrimaryPane = 'YES';
    $scope.showSecondaryPane = 'NO';
    $scope.showBottomPane = 'NO';
    $scope.showBoundBoxInfo = 'NO';
    $scope.showOnlyGraphics = 'NO';
    $scope.showItemslistHierarchy = 'NO';

    $scope.defaultBoundDragOptions = [
        0x000000F + 0x03F0000,            // Unselected: TRANSLATE_ALL | RESIZE_FACE_ALL
        0x000000F + 0x0000070 + 0x0003F00 // Selected:   TRANSLATE_ALL | ROTATE_ALL | RESIZE_ARROW_ALL
    ];

    $scope.nextModelId = 1;
    $scope.models = {};
    $scope.model = null;

    $scope.hideCallbackMenuChoice = "5";

    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    $scope.webglSettings = {
        'showGnomon':'YES',
        'showSpinCenter':'YES',
        'selectionFilter':'PART',
        'preselectionFilter':'PART',
        'structureEdit':'NO',
        'dragMode':'YES',
        'dragSnap':'NO',
        'showFloor':'NO',
        'showDropShadow': 'NO',
        'transparentFloor' : 'NO',
        'doNotRoll':'NO',
        'antiAliasing': iOS ? 'NO' : 'YES',
        'showProgress':'YES',
        'enableCrossSiteAccess':'NO',
        'removeModelsOnLoad':'YES',
        'autoload':'YES',
        'expandAncestors':'NO',
        'decayrate':0.0,
        'partselfillHexColor':'#0000FFBF',
        'partseloutlineHexColor':'#80FF00BF',
        'partpreselfillHexColor':'#800000BF',
        'partpreseloutlineHexColor':'#00FF00BF',
        'backgroundColorNum':'TWO',
        'backgroundHexColor':'#FFFFFFFF',
        'backgroundTopHexColor':'#000000FF',
        'backgroundBottomHexColor':'#FFFFFFFF',
        'shapeFilters':0x00300007,
        'selectionLogging':'NO',
        'navMode': 'CreoView',
        'selectHighlightStyle': 'FILL',
        'selectHighlightWidth': 5.0,
        'preSelectHighlightStyle': 'FILL',
        'preSelectHighlightWidth': 5.0,
        'showStatistics': 'NO',
        'statsPollingRate': 1000
    };
    $scope.pdfSettings = {
        'toolbarEnabled':'YES'
    };
    $scope.webglSettingsLoaded = false;
    $scope.loadState = "";
    $scope.loadTime = 0;
    $scope.startTime = 0;
    $scope.nodeSelection = [];
    $scope.selection = [];
    $scope.featureSelection = {};
    $scope.lastSelIdpath = "";
    $scope.activeMenu = "home";
    $scope.ModelsMenuVisible = false;
    $scope.SettingsMenuVisible = false;
    $scope.SettingsSubMenuVisible = false;
    $scope.markedComps;
    $scope.ibName = "";
    $scope.ibUrl = "";
    $scope.recentUrlDataSets = [];
    $scope.ccName = "";
    $scope.ccUrl = "";
    $scope.ccId = "";
    $scope.recentShapeSourceDataSets = [];

    $scope.partColorSelector = 0;
    $scope.backgroundColorNum = 'TWO';
    $scope.partSelectionFillColor       = "#0000FFBF";//'RGBA(0,0,255,0.75)';    // 1
    $scope.partSelectionOutlineColor    = "#80FF00BF";//'RGBA(128,255,0,0.75)';  // 2
    $scope.partPreselectionFillColor    = "#800000BF";//'RGBA(128,0,0,0.75)';    // 3
    $scope.partPreselectionOutlineColor = "#00FF00BF";//'RGBA(0,255,0,0.75)';    // 4
    $scope.backgroundTopColor           = "#000000FF";//'RGBA(0,0,0,1.0)';       // 5
    $scope.backgroundBottomColor        = "#FFFFFFFF";//'RGBA(255,255,255,1.0)'; // 6
    $scope.backgroundColor              = "#FFFFFFFF";//'RGBA(255,255,255,1.0)'; // 7

    $scope.customSelectColor = [
        {
            fill:    "#FF0000BF", //'RGBA(255,0,0,0.75)';    // 8 - Select1
            outline: "#FF0000BF"  //'RGBA(255,0,0,0.75)';    // 9
        },
        {
            fill:    "#00FF00BF", //'RGBA(0,255,0,0.75)';    // 10 -Select2
            outline: "#00FF00BF"  //'RGBA(0,255,0,0.75)';    // 11
        },
        {
            fill:    "#00FFFFBF", //'RGBA(0,255,255,0.75)';    // 12 -Select3
            outline: "#00FFFFBF"  //'RGBA(0,255,255,0.75)';    // 13
        },
        {
            fill:    "#8000FFBF", //'RGBA(128,0,255,0.75)';    // 14 -Select4
            outline: "#8000FFBF"  //'RGBA(128,0,255,0.75)';    // 15
        },
        {
            fill:    "#0080FFBF", //'RGBA(0,128,255,0.75)';    // 16 -Select5
            outline: "#0080FFBF"  //'RGBA(0,128,255,0.75)';    // 17
        }
    ];

    $scope.customSelectMode = 1;
    $scope.customCurrentSelectMode = 1;
    $scope.customSelectPickerFillColor = $scope.customSelectColor[0].fill;
    $scope.customSelectPickerOutlineColor = $scope.customSelectColor[0].outline;
    $scope.customSelectPickerDisplay = 0; // Fill=0 Outline=1
    $scope.customSelectType = "FILL";
    $scope.customSelectStyleArray = ["FILL", "FILL", "FILL", "FILL", "FILL"];

    $scope.selectHighlightStyle = "FILL";
    $scope.preselectHighlightStyle = "FILL";

    function generateWidthArray(size) {
        let arr = [];
        for (let i=0; i<size; i++) {
            let obj = {};
            obj.id = i + 1;
            obj.label = (i + 1).toString() + 'px';
            arr.push(obj);
        }
        return arr;
    }
    $scope.highlightSelectWidths = generateWidthArray(25);
    $scope.highlightSelectWidth = $scope.highlightSelectWidths[0];

    $scope.highlightPreSelectWidths = generateWidthArray(25);
    $scope.highlightPreSelectWidth = $scope.highlightPreSelectWidths[0];

    $scope.customSelectHighlightWidths = generateWidthArray(25);
    $scope.customSelectWidth = $scope.customSelectHighlightWidths[4];
    $scope.customSelectWidths = [5.0, 5.0, 5.0, 5.0, 5.0];

    $scope.layers = [];
    $scope.selectedLayer = undefined;
    $scope.layerTarget = undefined;
    $scope.layerTargetText = "";

    $scope.boundMarkers = [];
    $scope.currentBoundMarker = null;
    $scope.currentSpatialFilterBound = null;
    $scope.dragOptionTranslate = [
        {name: 'X', param: 'X', code: '0x1'},
        {name: 'Y', param: 'Y', code: '0x2'},
        {name: 'Z', param: 'Z', code: '0x4'},
        {name: 'P', param: 'P', code: '0x8'}
    ];
    $scope.dragOptionRotate = [
        {name: 'X', param: 'X', code: '0x10'},
        {name: 'Y', param: 'Y', code: '0x20'},
        {name: 'Z', param: 'Z', code: '0x40'}
    ];
    $scope.dragOptionArrow = [
        {name: '+X', param: 'XP', code: '0x100'},
        {name: '-X', param: 'XM', code: '0x200'},
        {name: '+Y', param: 'YP', code: '0x400'},
        {name: '-Y', param: 'YM', code: '0x800'},
        {name: '+Z', param: 'ZP', code: '0x1000'},
        {name: '-Z', param: 'ZM', code: '0x2000'}
    ];
    $scope.dragOptionFace = [
        {name: '+X', param: 'XP', code: '0x10000'},
        {name: '-X', param: 'XM', code: '0x20000'},
        {name: '+Y', param: 'YP', code: '0x40000'},
        {name: '-Y', param: 'YM', code: '0x80000'},
        {name: '+Z', param: 'ZP', code: '0x100000'},
        {name: '-Z', param: 'ZM', code: '0x200000'}
    ];

    $scope.boxCalculation = "";
    $scope.sphereCalculation = "";

    $scope.useInputbbox = 'NO';
    $scope.inputbbox = {
        min: {x: '0', y: '0', z: '0'},
        max: {x: '1', y: '1', z: '1'}
    };
    $scope.bboxcheck = 'NO';
    $scope.bboxTitleSet = {
        minmax: ['Min',    'X', 'Y', 'Z', 'Max',    'X', 'Y', 'Z'],
        cenlen: ['Center', 'X', 'Y', 'Z', 'Length', 'X', 'Y', 'Z']
    };
    $scope.bboxTitle = $scope.bboxTitleSet.minmax;

    $scope.useInputbsphere = 'NO';
    $scope.inputbsphere = {
        min: {x: '0', y: '0', z: '0'},
        max: {x: '1', y: '1', z: '1'}
    };
    $scope.bsphereTitleSet = {
        minmax: ['Min',    'X', 'Y', 'Z', 'Max', 'X', 'Y', 'Z'],
        cenrad: ['Center', 'X', 'Y', 'Z', 'Radius', '', '', '']
    };
    $scope.bsphereTitle = $scope.bsphereTitleSet.minmax;

    $scope.groupName = "TestGroup";
    $scope.propName = "TestProperty";
    $scope.setPropertyResult = ""
    $scope.getPropertyResult = ""
    $scope.findPropertyResult = "";
    $scope.foundIds = [];
    $scope.instList = [];
    $scope.instanceProperties = [];
    $scope.propertyNames = [];
    $scope.instanceSelector = "";
    $scope.instanceName = "";

    $scope.partLocation = {};
    $scope.locationOverride = "NO";

    $scope.viewOrientationStatus = "-";
    $scope.viewOrienX = "-30";
    $scope.viewOrienY = "45";
    $scope.viewOrienZ = "0";

    $scope.visibilityCheck = "YES";
    $scope.visibilityOverride = "NO";

    $scope.jsonMessage = [];
    $scope.uidMap = {};
    $scope.idpathMap = {};
    $scope.treeObserver = null;

    $scope.dialogId = "";
    $scope.dialogTitleId = "";
    $scope.firstStep = false;
    $scope.lastStep = false;
    $scope.curSequenceStep = null;
    $scope.curSequenceStepPosition = null;
    $scope.curSequenceStepState = null;
    $scope.sequenceStep = 1;
    $scope.sequenceNoAck = false;
    $scope.stepNames = [];
    $scope.stepDescriptions = [];

    $scope.animationSpeed = 1.0;

    $scope.zoomScale = "0.2";

    $scope.navigation = ["CreoView", "Creo", "CATIA V5-Compatible", "Explore"];

    $scope.orientPreset = {name:'',orient: undefined};
    $scope.orientPresets = [{
        name: 'ISO1'
    }, {
        name: 'ISO2'
    }, {
        name: 'Top'
    }, {
        name: 'Bottom'
    }, {
        name: 'Left'
    }, {
        name: 'Right'
    }, {
        name: 'Front'
    }, {
        name: 'Back'
    }];
    $scope.orientations = $scope.orientPresets.concat($scope.viewOrients);

    $scope.modelOrientPreset = '';
    $scope.modelOrientations = ['X', '-X', 'Y', '-Y', 'Z', '-Z'];

    $scope.pageModePreset = '';
    $scope.pageModes = ['Original', 'Fit Page', 'Fit Width', '500%', '250%', '200%', '100%', '75%', '50%'];

    $scope.sectioning = false;
    $scope.sectioningUserCreated = false;
    $scope.sectioningPlanar = true;

    $scope.sectioningPreset = '';
    $scope.sectioningPresets = ['X-Axis', 'Y-Axis', 'Z-Axis'];

    $scope.showSpinner = false;
    $scope.webglVersion = "";

    // Leader Line
    $scope.leaderlines = [];
    $scope.nextLeaderlineId = 1;
    $scope.creatingLeaderLine = false;
    $scope.leaderlineBbox = {};
    $scope.leaderlineMouseDownX;
    $scope.leaderlineMouseDownY;
    $scope.leaderlineTouchValid = false;
    $scope.leaderlineMouseDownTime;
    $scope.leaderlineJitterLimit = 3;
    $scope.leaderlineTimeLimit = 200;
    $scope.currentLeaderLine = null;
    $scope.currentLeaderLineColor = "#FF0000";//'RGB(255,0,0)';
    $scope.leaderLineWidths = generateWidthArray(6);
    $scope.leaderLineWidth = $scope.leaderLineWidths[0];
    $scope.leaderLineStyles = [{
        id: 1,
        label: 'Solid'
    }, {
        id: 2,
        label: 'Hidden Line'
    }, {
        id: 3,
        label: 'Long Dash Dot'
    }, {
        id: 4,
        label: 'Center Line'
    }, {
        id: 5,
        label: 'Four Dot Break'
    }, {
        id: 6,
        label: 'Dashed'
    }, {
        id: 7,
        label: 'Dash Dash Dash'
    }, {
        id: 8,
        label: 'Dotted'
    }, {
        id: 9,
        label: 'Dot Dot Dot'
    }, {
        id: 10,
        label: 'Dash Dot Dash'
    }, {
        id: 11,
        label: 'Dot Dash'
    }, {
        id: 12,
        label: 'Dot Dot Dash'
    }];
    $scope.leaderLineStyle = $scope.leaderLineStyles[0];
    $scope.leaderLineEndCaps = [{
        id: 1,
        label: 'None'
    }, {
        id: 2,
        label: 'Point'
    }, {
        id: 3,
        label: 'Round'
    }];
    $scope.leaderLineHead = $scope.leaderLineEndCaps[0];
    $scope.leaderLineTail = $scope.leaderLineEndCaps[0];

    $scope.spatialFilterItemsIncluded = "YES";
    $scope.spatialFilterLocalTo = "Box";
    $scope.spatialFilterSearchMode = "Quick";
    $scope.spatialFilterResult = {};
    $scope.spatialFilterResult.query = {};
    $scope.spatialFilterResult.filteredItemsNum = 0;
    $scope.spatialFilterResult.filteredItems = [];

    $scope.$watch('currentLeaderLineColor', function() {
        if ($scope.creatingLeaderLine)
            $scope.ApplyLeaderLineProperties();
    });

    $scope.$watch('orientPreset', function() {
        if (Module.OrientPreset === undefined)
            return;

        if ($scope.orientPreset.orient != undefined) {
            $scope.shapeView.ApplyOrientation($scope.orientPreset.orient, 1000.0);
            $scope.GetViewLocation();
            $scope.orientPreset = {name:'',orient: undefined};
        } else {
            if ($scope.orientPreset.name != "") {
                var preset = "";
                if ($scope.orientPreset.name == 'ISO1')
                    preset = Module.OrientPreset.ORIENT_ISO1;
                else if ($scope.orientPreset.name == 'ISO2')
                    preset = Module.OrientPreset.ORIENT_ISO2;
                else if ($scope.orientPreset.name == 'Top')
                    preset = Module.OrientPreset.ORIENT_TOP;
                else if ($scope.orientPreset.name == 'Bottom')
                    preset = Module.OrientPreset.ORIENT_BOTTOM;
                else if ($scope.orientPreset.name == 'Left')
                    preset = Module.OrientPreset.ORIENT_LEFT;
                else if ($scope.orientPreset.name == 'Right')
                    preset = Module.OrientPreset.ORIENT_RIGHT;
                else if ($scope.orientPreset.name == 'Front')
                    preset = Module.OrientPreset.ORIENT_FRONT;
                else if ($scope.orientPreset.name == 'Back')
                    preset = Module.OrientPreset.ORIENT_BACK;

                if (preset !== "") {
                    $scope.shapeView.ApplyOrientPreset(preset, 1000.0);
                    $scope.GetViewLocation();
                    $scope.orientPreset = {name:'',orient: undefined};
                }
            }
        }
    });

    $scope.SetModelUpDirection = function() {
        if ($scope.model) {
            $scope.model.SetUpDirection($scope.modelOrientPreset, 0.0);
            $scope.ResizeFloor();
        }
    };

    $scope.$watch('webglSettings.dragSnap', function() {
        if ($scope.shapeView) {
            $scope.shapeView.SetDragSnap($scope.webglSettings.dragSnap == 'YES');
            $scope.SaveWebglSettings('dragSnap');
        }
    });

    $scope.$watch('webglSettings.dragMode', function() {
        if ($scope.shapeView) {
            if ($scope.webglSettings.dragMode == "YES")
                $scope.shapeView.SetDragMode(Module.DragMode.DRAG);
            else
                $scope.shapeView.SetDragMode(Module.DragMode.NONE);
            $scope.SaveWebglSettings('dragMode');
        }
    });

    $scope.$watch('webglSettings.selectionFilter', function() {
        if ($scope.session) {
            $scope.UpdateSelectionFilter();
            $scope.HideModelLocationRibbon();
            $scope.SaveWebglSettings('selectionFilter');
        }
    });

    $scope.$watch('webglSettings.preselectionFilter', function() {
        if ($scope.session) {
            $scope.UpdateSelectionFilter();
            $scope.HideModelLocationRibbon();
            $scope.SaveWebglSettings('preselectionFilter');
        }
    });

    $scope.$watch('webglSettings.structureEdit', function() {
        if ($scope.session) {
            $scope.SaveWebglSettings('structureEdit');
        }
    });


    $scope.$watch('webglSettings.showGnomon', function() {
        if ($scope.shapeView) {
            $scope.shapeView.ShowGnomon($scope.webglSettings.showGnomon == 'YES');
            $scope.SaveWebglSettings('showGnomon');
        }
    });

    $scope.$watch('webglSettings.showSpinCenter', function() {
        if ($scope.shapeView) {
            $scope.shapeView.ShowSpinCenter($scope.webglSettings.showSpinCenter == 'YES');
            $scope.SaveWebglSettings('showSpinCenter');
        }
    });

    $scope.$watch('webglSettings.enableCrossSiteAccess', function() {
        if ($scope.session) {
            $scope.session.EnableCrossSiteAccess($scope.webglSettings.enableCrossSiteAccess == 'YES');
            $scope.SaveWebglSettings('enableCrossSiteAccess');
        }
    });

    $scope.$watch('webglSettings.removeModelsOnLoad', function() {
        if ($scope.session) {
            $scope.SaveWebglSettings('removeModelsOnLoad');
        }
    });

    $scope.$watch('webglSettings.autoload', function() {
        if ($scope.session) {
            $scope.SaveWebglSettings('autoload');
        }
    });

    $scope.$watch('webglSettings.expandAncestors', function() {
        if ($scope.session) {
            $scope.SaveWebglSettings('expandAncestors');
        }
    });

    $scope.$watch('webglSettings.decayrate', function() {
        if ($scope.session) {
            $scope.SaveWebglSettings('decayrate');
        }
    });

    $scope.$watch('webglSettings.backgroundColorNum', function() {
        if ($scope.session) {
            $scope.SaveWebglSettings('backgroundColorNum');
        }
    });

    $scope.$watch('webglSettings.selectionLogging', function() {
        if ($scope.session) {
            $scope.SaveWebglSettings('selectionLogging');
        }
    });

    $scope.$watch('pdfSettings.toolbarEnabled', function() {
        if ($scope.session) {
            $scope.SetPdfToolbar();
        }
    });

    $scope.$watch('webglSettings.showFloor', function() {
        if ($scope.session) {
            $scope.ResizeFloor();
            $scope.SaveWebglSettings('showFloor');
        }
    });

    $scope.$watch('webglSettings.transparentFloor', function () {
        if ($scope.session)  {
            $scope.ResizeFloor();
            $scope.SaveWebglSettings('transparentFloor');
        }
    });

    $scope.$watch('webglSettings.showDropShadow', function () {
        if ($scope.shapeScene) {
            var shadow_itensity = 0.5;
            if ($scope.webglSettings.showDropShadow == 'YES')
                $scope.shapeScene.SetShadowMode(Module.ShadowMode.SOFT_DROP_SHADOW, shadow_itensity);
            else
                $scope.shapeScene.SetShadowMode(Module.ShadowMode.OFF, shadow_itensity);
            $scope.ResizeFloor();
            $scope.SaveWebglSettings('showDropShadow');
        }
    });

    $scope.$watch('webglSettings.doNotRoll', function() {
        if ($scope.shapeView) {
            $scope.shapeView.SetDoNotRoll($scope.webglSettings.doNotRoll == 'YES');
            if ($scope.webglSettings.doNotRoll == 'YES')
                $scope.SetViewOrientation();
            $scope.SaveWebglSettings('doNotRoll');
        }
    });

    $scope.$watch('webglSettings.antiAliasing', function() {
        if ($scope.shapeView) {
            if ($scope.webglSettings.antiAliasing == "YES")
                $scope.shapeView.SetAntialiasingMode(Module.AntialiasingMode.SS4X);
            else
                $scope.shapeView.SetAntialiasingMode(Module.AntialiasingMode.NONE);
            $scope.SaveWebglSettings('antiAliasing');
        }
    });

    $scope.$watch('webglSettings.showProgress', function() {
        if ($scope.shapeScene) {
            if ($scope.webglSettings.showProgress == "YES")
                $scope.shapeScene.ShowProgress(true);
            else
                $scope.shapeScene.ShowProgress(false);
            $scope.SaveWebglSettings('showProgress');
        }
    });

    $scope.$watch('webglSettings.navMode', function() {
        if ($scope.shapeView) {
            $scope.SetNavigationMode($scope.webglSettings.navMode);
            $scope.SaveWebglSettings('navMode');
        }
    });

    $scope.$watch('bboxcheck', function() {
        if ($scope.bboxcheck == 'YES') {
            $scope.bboxTitle = $scope.bboxTitleSet.cenlen;
            $scope.bsphereTitle = $scope.bsphereTitleSet.cenrad;

            document.getElementById("inputbsphere12").disabled = true;
            document.getElementById("inputbsphere13").disabled = true;
        } else { // 'NO'
            $scope.bboxTitle = $scope.bboxTitleSet.minmax;
            $scope.bsphereTitle = $scope.bsphereTitleSet.minmax;

            document.getElementById("inputbsphere12").disabled = false;
            document.getElementById("inputbsphere13").disabled = false;
        }
    });

    $scope.$watch('webglSettings.showStatistics', function() {
        if ($scope.session) {
            $scope.stats.ShowStatistics($scope.webglSettings.showStatistics == 'YES');
            $scope.SaveWebglSettings('showStatistics');
        }
    });

    $scope.SetWebglSettings = function(setting) {
        $scope.webglSettingsLoaded = true;
        $scope.webglSettings[setting.key] = setting.value;

        if (setting.key.indexOf('Color') == -1) return;

        if (setting.key == 'partselfillHexColor') {
            $scope.partSelectionFillColor = setting.value;
        } else if (setting.key == 'partseloutlineHexColor') {
            $scope.partSelectionOutlineColor = setting.value;
        } else if (setting.key == 'partpreselfillHexColor') {
            $scope.partPreselectionFillColor = setting.value;
        } else if (setting.key == 'partpreseloutlineHexColor') {
            $scope.partPreselectionOutlineColor = setting.value;
        } else if (setting.key == 'backgroundHexColor') {
            $scope.backgroundColor = setting.value;
        } else if (setting.key == 'backgroundTopHexColor') {
            $scope.backgroundTopColor = setting.value;
        } else if (setting.key == 'backgroundBottomHexColor') {
            $scope.backgroundBottomColor = setting.value;
        } else if (setting.key == 'backgroundColorNum') {
            $scope.backgroundColorNum = setting.value;
        }
    }

    $scope.SaveWebglSettings = function(key) {
        if (dbWebglSettings == undefined) return;

        var value = $scope.webglSettings[key];
        if (value) {
            var store = dbWebglSettings.transaction("WebglSettingsObjectStore", "readwrite").objectStore("WebglSettingsObjectStore");
            store.put({key:key, value:value});

            $scope.webglSettingsLoaded = true;
        }
    }

    $scope.SetPdfToolbar = function() {
        var value = $scope.pdfSettings['toolbarEnabled'] == 'NO' ? false : true;
        if (ThingView && ThingView.IsPDFSession()) {
            ThingView.SetPdfToolbar($scope.sessionId, value, null);
        }
    }

    $scope.UpdateSelectionFilter = function() {
        if ($scope.shapeScene) {
            if ($scope.webglSettings.selectionFilter == 'PART') {
                $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.PART, Module.SelectionList.PRIMARYSELECTION);
            } else if ($scope.webglSettings.selectionFilter == 'MODEL') {
                $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.MODEL, Module.SelectionList.PRIMARYSELECTION);
            } else if ($scope.webglSettings.selectionFilter == 'DISABLED') {
                $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.DISABLED, Module.SelectionList.PRIMARYSELECTION);
            }

            if ($scope.webglSettings.preselectionFilter == 'PART') {
                $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.PART, Module.SelectionList.PRESELECTION);
            } else if ($scope.webglSettings.preselectionFilter == 'MODEL') {
                $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.MODEL, Module.SelectionList.PRESELECTION);
            } else if ($scope.webglSettings.preselectionFilter == 'DISABLED') {
                $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.DISABLED, Module.SelectionList.PRESELECTION);
            }
        }
    }

    $scope.ResetIndexedDBSettings = function() {
        var request = window.indexedDB.open("WebglSettingsDatabase", 1);
        request.onsuccess = function(event) {
            var tx = dbWebglSettings.transaction(["WebglSettingsObjectStore"], "readwrite");
            var store = tx.objectStore("WebglSettingsObjectStore");
            var req = store.clear();
            req.onerror = function(event) {
            console.log('Error deleting database - WebglSettingsDatabase.');
            };
            req.onsuccess = function (event) {
                alert('All settings in indexed DB are deleted.\nReload the page now.');
            };
        }
    }

    $scope.ResizeFloor = function() {
        if ($scope.shapeScene) {
            var floorsize = { w: 0, l: 0, pos: { x: 0.0, y: 0.0, z: 0.0 } };
            var bounds = $scope.shapeScene.GetWorldBoundingBox();
            if (bounds.valid) {
                var x = bounds.max.x - bounds.min.x;
                var y = bounds.max.y - bounds.min.y;
                var z = bounds.max.z - bounds.min.z;
                floorsize.w = x;
                floorsize.l = z;

                floorsize.pos.x = bounds.min.x + (x / 2);
                floorsize.pos.z = bounds.min.z + (z / 2);
                floorsize.pos.y = 0;
                var floor_grid_color = 0x505050E0;
                var floor_plane_color = 0xE0E0E0E0;
                if ($scope.webglSettings.transparentFloor == 'YES')
                {
                    // set alpha value to 0 for transparency effect
                    floor_grid_color = 0x50505000;
                    floor_plane_color = 0xE0E0E000;
                }
                // increase floor size to cover shadow effect (mainly on the outline of the model)
                if ($scope.webglSettings.showDropShadow == 'YES') {
                    floorsize.w = floorsize.w * 1.03;
                    floorsize.l = floorsize.l * 1.03;
                }
                $scope.shapeScene.ShowFloorWithSize($scope.webglSettings.showFloor == 'YES', floorsize.w, floorsize.l, floorsize.pos, floor_grid_color, floor_plane_color);
            }
        }
    }

     $scope.UpdateModelsList = function() {
        $scope.availableModels = [];

        $scope.availableDataSets.forEach(function(data) {
            $scope.availableModels.push(data);
        });
        $scope.availablePVSUrls.forEach(function(data) {
            $scope.availableModels.push(data);
        });
    }

    $scope.LoadAvailableModel = function(model) {
        if (model.id) {
            $scope.LoadFromIndexDb(model.id);
        } else if (model.name) {
            $scope.LoadPVS(model.name);
        }

        $scope.UpdateModelsList();
    }

    $scope.DeleteAvailableModel = function(event, model) {
        if (model.id) {
            $scope.DeleteFromIndexDb(event, model.id);
        } else if (model.name) {
            $scope.DeleteUrlFromIndexDb(event, model.name);
        }
    }

    $scope.LoadFromIndexDb = function(key) {
        $scope.ModelsMenuVisible = false;
        if (dbFileCache == undefined) return;
        dbFileCache.transaction("FileCacheObjectStore", "readwrite").objectStore("FileCacheObjectStore").openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                if (cursor.value.id == key) {
                    var updateData = cursor.value;
                    updateData.timestamp = Math.floor(Date.now() / 1000);

                    for (let i=0; i<$scope.availableDataSets.length;i++) {
                        if ($scope.availableDataSets[i].id == key) {
                            $scope.availableDataSets[i].timestamp = updateData.timestamp;
                            break;
                        }
                    }

                    $scope.LoadModel(key, updateData.name);
                    cursor.update(updateData);
                    return;
                }

                cursor.continue();
            }
        };
    }

    $scope.DeleteFromIndexDb = function(event, key) {
        if (dbFileCache == undefined) return;
        var dataSet = dbFileCache.transaction("FileCacheObjectStore", "readwrite").objectStore("FileCacheObjectStore").delete(key);
        dataSet.onsuccess = function(event) {
            $scope.SafeApply(function() {
                for (let i=0; i<$scope.availableDataSets.length;i++) {
                    if ($scope.availableDataSets[i].id == key) {
                        $scope.availableDataSets.splice(i, 1);
                        $scope.UpdateModelsList();
                        break;
                    }
                }
            });
        }

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.DeleteAllIndexDb = function() {
        var req = window.indexedDB.deleteDatabase("FileCacheDatabase");
        req.onsuccess = function () {
            console.log("Deleted database successfully");
        };
        req.onerror = function () {
            console.log("Couldn't delete database");
        };
        req.onblocked = function () {
            console.log("Couldn't delete database due to the operation being blocked");
        };
        $scope.availableDataSets = [];
    }

    $scope.DeleteUrlFromIndexDb = function(event, key) {
        if (dbRecentPVSURL == undefined) return;
        var dataSet = dbRecentPVSURL.transaction("RecentPVSURLObjectStore", "readwrite").objectStore("RecentPVSURLObjectStore").delete(key);
        dataSet.onsuccess = function(event) {
            $scope.SafeApply(function() {
                for (let i=0; i<$scope.availablePVSUrls.length;i++) {
                    if ($scope.availablePVSUrls[i].name == key) {
                        $scope.availablePVSUrls.splice(i, 1);
                        $scope.UpdateModelsList();
                        break;
                    }
                }
            });
        }

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.ZoomView = function() {
        if(ThingView.IsSVGSession()){
            ThingView.ResetTransformSVG();
        } else if (ThingView.IsPDFSession()) {
            ThingView.ZoomAllButtonPdf();
        } else {
            $scope.shapeView.ZoomView(Module.ZoomMode.ZOOM_ALL, 1000.0);
        }
    }
    $scope.ZoomSelected = function() {
        $scope.shapeView.ZoomView(Module.ZoomMode.ZOOM_SELECTED, 1000.0);
    }
    $scope.ZoomWindow = function() {
        if(ThingView.IsSVGSession()){
            ThingView.SetZoomWindow();
        } else {
            $scope.shapeView.ZoomView(Module.ZoomMode.ZOOM_WINDOW, 1000.0);
        }
    }
    $scope.ZoomIn = function() {
        if(ThingView.IsSVGSession()){
            ThingView.SetZoomOnButton(1 + Number($scope.zoomScale));
        } else if (ThingView.IsPDFSession()) {
             ThingView.ZoomOnButtonPdf(1.2)
        } else {
            $scope.shapeView.ApplyZoomScale(1.0 - Number($scope.zoomScale), 1000.0);
        }
    }
    $scope.ZoomOut = function() {
        if(ThingView.IsSVGSession()){
            ThingView.SetZoomOnButton(1 - Number($scope.zoomScale));
        } else if (ThingView.IsPDFSession()) {
             ThingView.ZoomOnButtonPdf(0.8)
        }  else {
            $scope.shapeView.ApplyZoomScale(1.0 + Number($scope.zoomScale), 1000.0);
        }
    }
    $scope.RotateDocumentPages = function(clockwise) {
        if (ThingView) {
            ThingView.RotateDocumentPages(clockwise);
        }
    }
    $scope.PrintPdf = function() {
        if (ThingView) {
            ThingView.PrintPdf();
        }
    }

    $scope.SetNavigationMode = function(navMode) {
        if (navMode == "CreoView")
            $scope.shapeView.SetNavigationMode(Module.NavMode.CREO_VIEW);
        else if (navMode == "Creo")
            $scope.shapeView.SetNavigationMode(Module.NavMode.CREO);
        else if (navMode == "CATIA V5-Compatible")
            $scope.shapeView.SetNavigationMode(Module.NavMode.CATIA);
        else if (navMode == "Explore")
            $scope.shapeView.SetNavigationMode(Module.NavMode.EXPLORE);
    }

    $scope.SetOrthographicView = function() {
        $scope.orthoProjection = true;
        if (!$scope.shapeView.IsOrthographic())
            $scope.shapeView.SetOrthographicProjection(1.0);
    }
    $scope.SetPerspectiveView = function() {
        $scope.orthoProjection = false;
        if (!$scope.shapeView.IsPerspective())
            $scope.shapeView.SetPerspectiveProjection(60.0);
    }

    $scope.GetProjectionMode = function() {
        $scope.SafeApply(function () {
            $scope.orthoProjection = $scope.shapeView.IsOrthographic();
        });
    }

    $scope.HighlightPart = function(idpath) {
        if ($scope.model) {
            $scope.DeselectAll(Module.SelectionList.PRESELECTION);
            $scope.model.SelectPart(idpath, true, Module.SelectionList.PRESELECTION);
        }
    }
    $scope.DehighlightPart = function(idpath) {
        if ($scope.model) {
            $scope.model.SelectPart(idpath, false, Module.SelectionList.PRESELECTION);
        }
    }

    $scope.SelectAllParts = function() {
        if ($scope.model) {
            $scope.model.SelectAllParts();
        }
    }
    $scope.DeselectAll = function(selectType) {
        var keys = Object.keys($scope.models);
        for (var i=0; i<keys.length; i++) {
            var model = $scope.models[keys[i]];
            if (model) {
                model.DeselectAll(selectType);
            }
        }
    }

    $scope.ViewLocationKeyPressed = function(event) {
        if (event.keyCode == 13) { // Return key
            $scope.SetViewLocation();
        }
    }

    $scope.SetViewLocation = function() {
        var loc = new Object();
        loc.position = {
            x: parseFloat($scope.viewLocation.position.x),
            y: parseFloat($scope.viewLocation.position.y),
            z: parseFloat($scope.viewLocation.position.z)
        };
        loc.orientation = {
            x: parseFloat($scope.viewLocation.orientation.x),
            y: parseFloat($scope.viewLocation.orientation.y),
            z: parseFloat($scope.viewLocation.orientation.z)
        };
        loc.scale = {
            x: 1.0,
            y: 1.0,
            z: 1.0
        };
        loc.size = {
            x: 1.0,
            y: 1.0,
            z: 1.0
        };
        loc.valid = true;
        $scope.shapeView.SetViewLocation(loc);
        $scope.viewLocation = loc;
        $scope.viewLocationSet = "YES";
    }

    $scope.SetViewOrientation = function() {
        var orient = {
            x: parseFloat($scope.viewOrienX),
            y: parseFloat($scope.viewOrienY),
            z: parseFloat($scope.viewOrienZ)
        };
        $scope.shapeView.ApplyOrientation(orient, 1000.0);
        $scope.GetViewLocation();
    }

    $scope.ApplyViewOrientation = function(orient) {
        $scope.shapeView.ApplyOrientation(orient, 1000.0);
    }

    $scope.SetViewState = function (viewStateName, viewStatePath) {
        $scope.currentDocument = null;
        $scope.shapeScene.RemoveSectionCut();
        $scope.sectioning = false;
        $scope.sectioningUserCreated = false;
        $scope.model.LoadViewState(viewStateName, viewStatePath);
    }

    $scope.LoadSVGCB = function (){
        if ($scope.activeMenu != "home")
            $scope.activeMenu = "home";
        $scope.ApplyLoadSVGResult();
        ThingView.SetSVGCalloutCallback($scope.SVGCalloutCB);
    }

    $scope.SVGCalloutCB = function(calloutID){
        if($scope.itemslist.length > 0){
            var calloutObj;
            var index;
            for (var i = 0; i<$scope.itemslist.length; i++) {
                if ($scope.itemslist[i].calloutId == calloutID) {
                    calloutObj = $scope.itemslist[i];
                    index = i;
                    break;
                }
            }
            if(calloutObj){
                calloutObj['selected'] = !calloutObj['selected'];
                $scope.ToggleTableSelection(index);
            }
        }
    }

    $scope.ApplyLoadSVGResult = function (){
        var callouts = ThingView.GetCallouts();
        $scope.itemslist = [];
        if(callouts.length > 0){
            for(var i = 0; i < callouts.length; i++){
                var obj = new Object();
                obj["calloutId"] = callouts[i].getAttribute("id");
                var calloutDesc = callouts[i].getElementsByTagName("desc");
                if (calloutDesc.length) {
                    var label = calloutDesc[0].textContent;
                    obj["label"] = label;
                    var parts = ThingView.GetSVGParts(label);
                    if(parts.length > 0){
                        var partDesc = parts[0].getElementsByTagName("desc");
                        if (partDesc.length) {
                            obj["nameTag"] = partDesc[0].textContent;
                        }
                    } else {
                        obj["nameTag"] = "";
                    }
                }
                obj["quantity"] = $scope.GetCalloutQuantity(callouts[i]);
                obj["selected"] = false;
                $scope.itemslist.push(obj);
            }
        }
    }

    $scope.GetCalloutQuantity = function(callout){
        var i;
        var qty = 0;
        var paths = callout.getElementsByTagName("path");
        for(i = 0; i < paths.length; i++){
            if (paths[i].getAttribute("stroke-dasharray")){
                var x = paths[i].getAttribute("d").trim().split(/\s+|[A-Z]+|[a-z]+/);
                x = x.filter(function(value){
                    return value!="";
                });
                qty += (x.length)/4;
            }
        }
        if(qty < 1){
            if (callout.innerHTML) {
                qty = (callout.innerHTML.match(/stroke-dasharray/g) || []).length;
            } else {
                var serialized = new XMLSerializer().serializeToString(callout);
                qty = (serialized.match(/stroke-dasharray/g) || []).length;
            }
        }
        if(qty < 1){
            qty = 0;
            var polylines = callout.getElementsByTagName("polyline");
            for (i = 0; i < polylines.length; i++){
                var points = polylines[i].getAttribute("points");
                qty += (points.trim().split(/\s+/).length)/4;
            }
        }
        qty = qty < 1 ? 1 : qty;
        return qty;
    }

    $scope.LoadDocumentCB = function (loadStatus) {
        $scope.currentPageNo = ThingView.GetCurrentPDFPage();
        $scope.totalPageNo = ThingView.GetTotalPDFPages();
    }

    $scope.LoadPage = function (pageNo) {
        if (ThingView) {
            $scope.SafeApply(function () {
                ThingView.LoadPage($scope.LoadDocumentCB, Number(pageNo));
            });
        }
    }
    $scope.LoadPrevPage = function () {
        if (ThingView) {
            $scope.SafeApply(function () {
                ThingView.LoadPrevPage($scope.LoadDocumentCB);
            });
        }
    }

    $scope.LoadNextPage = function () {
        if (ThingView) {
            $scope.SafeApply(function () {
                ThingView.LoadNextPage($scope.LoadDocumentCB);
            });
        }
    }

    $scope.BuildDocumentBookmarksTree = function (bookmarks) {
        var oldTree = document.getElementById("PdfBookmarksTree");
        if (oldTree){
            oldTree.parentNode.removeChild(oldTree);
        }
        if (bookmarks.length == 0){
            return;
        }
        var bookmarksTree = document.createElement("ul");
        bookmarksTree.id = "PdfBookmarksTree";
        for(var i = 0; i<bookmarks.length; i++){
            $scope.BuildDocumentBookmarksTreeContent(bookmarks[i], bookmarksTree);
        }
        var bookmarksPanel = document.getElementById("bookmarksDiv");
        bookmarksPanel.childNodes[1].appendChild(bookmarksTree);
    }

    $scope.BuildDocumentBookmarksTreeContent = function(bookmark, parentNode) {
        var liElem = document.createElement("li");
        parentNode.appendChild(liElem);
        if(bookmark.items.length == 0){
            liElem.textContent = bookmark.title;
            liElem.className = "viewableitem";
            liElem.addEventListener("click", function(e){
                if(ThingView){
                    ThingView.ShowPdfBookmark(e.target.textContent);
                }
            });
        } else {
            var caretElem = document.createElement("span");
            caretElem.textContent = "> ";
            caretElem.addEventListener("click", function(e){
                if(liElem.childNodes[2].style.display == "none"){
                    liElem.childNodes[2].style.display = "block";
                } else {
                    liElem.childNodes[2].style.display = "none";
                }
            });
            var spanElem = document.createElement("span");
            spanElem.textContent = bookmark.title;
            spanElem.className = "viewableitem";
            spanElem.addEventListener("click", function(e){
                if(ThingView){
                    ThingView.ShowPdfBookmark(e.target.textContent);
                }
            });
            liElem.appendChild(caretElem);
            liElem.appendChild(spanElem);
            var ulElem = document.createElement("ul");
            ulElem.style.display = "none";
            liElem.appendChild(ulElem);
            for (var i = 0; i<bookmark.items.length; i++){
                $scope.BuildDocumentBookmarksTreeContent(bookmark.items[i], ulElem);
            }
        }
    }

    $scope.setPageModePDF = function (pageMode) {
        var pageModeStripped = "";
        switch (pageMode){
            case "Original":
                pageModeStripped = "Original";
                break;
            case "Fit Page":
                pageModeStripped = "FitPage";
                break;
            case "Fit Width":
                pageModeStripped = "FitWidth";
                break;
            case "500%":
                pageModeStripped = "500percent";
                break;
            case "250%":
                pageModeStripped = "250percent";
                break;
            case "200%":
                pageModeStripped = "200percent";
                break;
            case "100%":
                pageModeStripped = "100percent";
                break;
            case "75%":
                pageModeStripped = "75percent";
                break;
            case "50%":
                pageModeStripped = "50percent";
                break;
        }
        if (pageModeStripped != "") {
            ThingView.SetPageModePDF(pageModeStripped);
        }
    }

    $scope.SetPanModePDF = function () {
        if (ThingView) {
            if (ThingView.IsPDFSession()){
                ThingView.SetPanModePDF();
            }
        }
    }

    $scope.SetTextModePDF = function () {
        if (ThingView) {
            if (ThingView.IsPDFSession()){
                ThingView.SetTextModePDF();
            }
        }
    }

    $scope.SubmitPdfSearch = function () {
        var searchTerm = document.getElementById("docSearchTextField").value;
        if (ThingView) {
            ThingView.SearchInPdfDocument(searchTerm);
        }
    }

    $scope.SubmitPdfSearchKey = function (e) {
        if (e.key === "Enter") {
            $scope.SubmitPdfSearch();
        } else if (e.key == "ArrowDown") {
            $scope.NextPdfSearch()
        } else if (e.key == "ArrowUp") {
            $scope.PrevPdfSearch();
        }
    }

    $scope.PrevPdfSearch = function () {
        if (ThingView) {
            ThingView.FocusPrevPdfDocumentSearch();
        }
    }

    $scope.NextPdfSearch = function () {
        if (ThingView) {
            ThingView.FocusNextPdfDocumentSearch();
        }
    }

    $scope.ClearPdfSearch = function () {
        document.getElementById("docSearchTextField").value = "";
        if (ThingView) {
            ThingView.ClearPdfDocumentSearch();
        }
    }

    $scope.TogglePdfSidePane = function () {
        if (ThingView) {
            ThingView.TogglePdfSidePane();
        }
    }

    $scope.TogglePdfMarkups = function () {
        if(ThingView && ThingView.IsPDFSession()) {
            ThingView.SetPdfMarkupsFilter(!ThingView.GetPdfMarkupsFilter());
        }
    }

    $scope.LoadDocument = function (viewable) {
        $scope.ResetSequenceStepInfo();
        $scope.currentDocument = viewable.humanReadableDisplayName;
        var extension = viewable.fileSource.substring(viewable.fileSource.lastIndexOf(".")+1);
        if (extension == "pdf") {
            $scope.documentScene = $scope.session.MakeDocumentScene();
            $scope.documentScene.LoadPdf(viewable.idPath, viewable.index, $scope.structure, function(success){
                if (!success) {
                    console.error("LoadDocument failed.");
                    return;
                }
                $scope.documentScene.GetPdfBuffer(function(val){
                    ThingView.LoadPDF($scope.sessionId, val, false, function(loadStatus){
                        if (!loadStatus) {
                            console.error("LoadPDF Failed");
                            return;
                        }
                        ThingView.SetPDFCallback($scope.LoadDocumentCB);
                        $scope.viewType = viewable.type;
                        $scope.viewExtension = extension;
                        $scope.view3D = false;
                        if($scope.viewType == Module.ViewableType.DOCUMENT || $scope.viewType == Module.ViewableType.DRAWING){
                            $scope.BuildDocumentBookmarksTree(ThingView.GetPdfBookmarks());
                            var toolbarEnabled = $scope.pdfSettings['toolbarEnabled'] == 'NO' ? false : true;
                            ThingView.SetPdfToolbar($scope.sessionId, toolbarEnabled, null);
                            $scope.LoadDocumentCB(loadStatus);
                        } else {
                            console.error("Illustration type not supported");
                        }
                    });
                });
            });
        } else {
            ThingView.LoadDocument(viewable, $scope.sessionId, $scope.model, function(loadStatus){
                ThingView.SetPDFCallback($scope.LoadDocumentCB);
                $scope.viewType = viewable.type;
                $scope.viewExtension = extension;
                $scope.view3D = false;
                if($scope.viewType == Module.ViewableType.DOCUMENT || $scope.viewType == Module.ViewableType.DRAWING){
                    console.error("Document type not supported");
                } else if ($scope.viewType == Module.ViewableType.ILLUSTRATION && loadStatus) {
                    if($scope.viewExtension == "svg"){
                        $scope.LoadSVGCB();
                    } else {
                        console.error("Illustration type not supported");
                    }
                } else {
                    if (!loadStatus) {
                        console.error("LoadDocument failed.");
                    }
                }
            });
            $scope.DelayedApply(10, function() {
                resizeBody();
            });
        }
    }

    $scope.ShowDocumentTooltip = function (viewable){
        //Currently do nothing
    }

    $scope.HideDocumentTooltip = function (viewable){
        //Currently do nothing
    }

    $scope.SetDefaultView = function () {
        if ($scope.model) {
            $scope.currentDocument = null;
            $scope.RemoveAllBoundingMarker();
            $scope.RemoveLeaderlines();
            $scope.LoadIllustration();
            $scope.shapeScene.ShowFloor(false, 0x505050E0, 0xE0E0E0E0);
            $scope.shapeScene.RemoveAllCVMarkups(Module.CV_MARKUP_TYPES.CVMARKUPTYPE_ALL);
            $scope.shapeScene.RemoveSectionCut();
            $scope.sectioning = false;
            $scope.sectioningUserCreated = false;
            $scope.model.ResetToPvkDefault();
            $scope.ClearNodeSelection();
            var idPathArr = new Module.VectorString();
            idPathArr.push_back('/');
            $scope.model.LoadParts(idPathArr, true, function(result) {
                if (result == true) {
                    $scope.shapeView.ZoomView(Module.ZoomMode.ZOOM_ALL, 0);
                }
            });
        }
    }

    $scope.SetEmptyView = function () {
        if ($scope.model) {
            $scope.currentDocument = null;
            $scope.RemoveAllBoundingMarker();
            $scope.RemoveLeaderlines();
            $scope.LoadIllustration();
            $scope.shapeScene.ShowFloor(false, 0x505050E0, 0xE0E0E0E0);
            $scope.shapeScene.RemoveAllCVMarkups(Module.CV_MARKUP_TYPES.CVMARKUPTYPE_ALL);
            $scope.shapeScene.RemoveSectionCut();
            $scope.model.ResetToPvkDefault();
            $scope.model.RemoveAllShapeInstances();

            $scope.ClearNodeSelection();
        }
    }

    $scope.UnsetLocation = function(includeChildren) {
        if ($scope.model) {
            $scope.model.UnsetLocation(includeChildren);
        }
    }

    $scope.UnsetSelectedLocation = function(includeChildren) {
        if ($scope.model) {
            $scope.model.UnsetSelectedLocation();
        }
    }

    $scope.GetViewLocation = function () {
        var loc = $scope.shapeView.GetViewLocation();
        $scope.viewLocation = loc;
        $scope.viewLocation.position.x = $scope.viewLocation.position.x.toFixed(6);
        $scope.viewLocation.position.y = $scope.viewLocation.position.y.toFixed(6);
        $scope.viewLocation.position.z = $scope.viewLocation.position.z.toFixed(6);

        $scope.viewLocation.orientation.x = $scope.viewLocation.orientation.x.toFixed(3);
        $scope.viewLocation.orientation.y = $scope.viewLocation.orientation.y.toFixed(3);
        $scope.viewLocation.orientation.z = $scope.viewLocation.orientation.z.toFixed(3);
    }

    $scope.GetPartLocation = function() {
        $scope.partLocation = {};
        if ($scope.instanceSelector.length == 0) return;

        var idPathArr = new Module.VectorString();
        var strippedIdpath = $scope.StripModelIdFromIdPath($scope.instanceSelector);
        idPathArr.push_back(strippedIdpath);
        if ($scope.model) {
            var locs = $scope.model.GetPartLocation(idPathArr);
            if (locs.size() == 1) {
                $scope.partLocation = locs.get(0);

                $scope.partLocation.position.x = $scope.partLocation.position.x.toFixed(6);
                $scope.partLocation.position.y = $scope.partLocation.position.y.toFixed(6);
                $scope.partLocation.position.z = $scope.partLocation.position.z.toFixed(6);

                $scope.partLocation.orientation.x = $scope.partLocation.orientation.x.toFixed(1);
                $scope.partLocation.orientation.y = $scope.partLocation.orientation.y.toFixed(1);
                $scope.partLocation.orientation.z = $scope.partLocation.orientation.z.toFixed(1);
            }
        }
    }

    $scope.UnsetPartLocation = function() {
        var idPathArr = new Module.VectorString();
        var strippedIdpath = $scope.StripModelIdFromIdPath($scope.instanceSelector);
        idPathArr.push_back(strippedIdpath);

        if ($scope.model) {
            $scope.model.UnsetPartLocation(idPathArr, $scope.locationOverride == 'YES');
            $scope.GetPartLocation();
        }
    }

    $scope.SetPartLocation = function() {
        if ($scope.model) {
            var locationArr = new Module.PartLocationVec();
            var location = new Object();

            location.idPath = $scope.partLocation.idPath;

            location.position = [];
            location.position.x = Number($scope.partLocation.position.x);
            location.position.y = Number($scope.partLocation.position.y);
            location.position.z = Number($scope.partLocation.position.z);

            location.orientation = [];
            location.orientation.x = Number($scope.partLocation.orientation.x);
            location.orientation.y = Number($scope.partLocation.orientation.y);
            location.orientation.z = Number($scope.partLocation.orientation.z);

            location.removeOverride = ($scope.visibilityOverride == 'YES');

            locationArr.push_back(location);

            $scope.model.SetPartLocation(locationArr);
            $scope.GetPartLocation();
        }
    }

    $scope.CalculateBoundingBox = function() {
        if ($scope.model) {
            var idPathArr = new Module.VectorString();
            var box = $scope.model.CalculateBoundingBox(idPathArr);
            if (box.valid) {
                $scope.boxCalculation = "Min:("
                                      + box.min.x.toFixed(6).toString() + ", "
                                      + box.min.y.toFixed(6).toString() + ", "
                                      + box.min.z.toFixed(6).toString()
                                      + ") Max:("
                                      + box.max.x.toFixed(6).toString() + ", "
                                      + box.max.y.toFixed(6).toString() + ", "
                                      + box.max.z.toFixed(6).toString() + ")";
                $scope.inputbbox = box;
            } else {
                $scope.boxCalculation = "Error: Invalid result";

                $scope.inputbbox.min.x = "0";
                $scope.inputbbox.min.y = "0";
                $scope.inputbbox.min.z = "0";
                $scope.inputbbox.max.x = "1";
                $scope.inputbbox.max.y = "1";
                $scope.inputbbox.max.z = "1";
            }
        }
    }
    $scope.CalculateBoundingSphere = function() {
        if ($scope.model) {
            var idPathArr = new Module.VectorString();
            var sphere = $scope.model.CalculateBoundingSphere(idPathArr);
            if (sphere.valid) {
                $scope.sphereCalculation = "Center:("
                                         + sphere.center.x.toFixed(6).toString() + ", "
                                         + sphere.center.y.toFixed(6).toString() + ", "
                                         + sphere.center.z.toFixed(6).toString()
                                         + ") Radius:"
                                         + sphere.radius.toFixed(6).toString();
                $scope.inputbsphere.min.x = sphere.center.x;
                $scope.inputbsphere.min.y = sphere.center.y;
                $scope.inputbsphere.min.z = sphere.center.z;
                $scope.inputbsphere.max.x = sphere.radius;
                $scope.inputbsphere.max.y = 1;
                $scope.inputbsphere.max.z = 1;
            } else {
                $scope.sphereCalculation = "Error: Invalid result";

                $scope.inputbsphere.min.x = "0";
                $scope.inputbsphere.min.y = "0";
                $scope.inputbsphere.min.z = "0";
                $scope.inputbsphere.max.x = "1";
                $scope.inputbsphere.max.y = "1";
                $scope.inputbsphere.max.z = "1";
            }
        }
    }

    $scope.SetDOTranslate = function(name, option, unsel) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            var id = unsel ? 0 : 1;
            if (option == 'All') {
                var bitRes = bound.selOptions[id] & 0xF;
                if (bitRes == 0xF) {
                    bound.selOptions[id] &= ~0xF;
                } else {
                    bound.selOptions[id] |= 0xF;
                }
            } else if (option == 'X') {
                if (bound.selOptions[id] & 0x1) {
                    bound.selOptions[id] &= ~0x1;
                } else {
                    bound.selOptions[id] |= 0x1;
                }
            } else if (option == 'Y') {
                if (bound.selOptions[id] & 0x2) {
                    bound.selOptions[id] &= ~0x2;
                } else {
                    bound.selOptions[id] |= 0x2;
                }
            } else if (option == 'Z') {
                if (bound.selOptions[id] & 0x4) {
                    bound.selOptions[id] &= ~0x4;
                } else {
                    bound.selOptions[id] |= 0x4;
                }
            } else if (option == 'P') {
                if (bound.selOptions[id] & 0x8) {
                    bound.selOptions[id] &= ~0x8;
                } else {
                    bound.selOptions[id] |= 0x8;
                }
            }

            $scope.SetDragOptions(name);
        }
    }

    $scope.SetDORotate = function(name, option, unsel) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            var id = unsel ? 0 : 1;
            if (option == 'All') {
                var bitRes = bound.selOptions[id] & 0x70;
                if (bitRes ==  0x70) {
                    bound.selOptions[id] &= ~0x70;
                } else {
                    bound.selOptions[id] |= 0x70;
                }
            } else if (option == 'X') {
                if (bound.selOptions[id] & 0x10) {
                    bound.selOptions[id] &= ~0x10;
                } else {
                    bound.selOptions[id] |= 0x10;
                }
            } else if (option == 'Y') {
                if (bound.selOptions[id] & 0x20) {
                    bound.selOptions[id] &= ~0x20;
                } else {
                    bound.selOptions[id] |= 0x20;
                }
            } else if (option == 'Z') {
                if (bound.selOptions[id] & 0x40) {
                    bound.selOptions[id] &= ~0x40;
                } else {
                    bound.selOptions[id] |= 0x40;
                }
            }

            $scope.SetDragOptions(name);
        }
    }

    $scope.SetDOArrow = function(name, option, unsel) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            var id = unsel ? 0 : 1;
            if (option == 'All') {
                var bitRes = bound.selOptions[id] & 0x3F00;
                if (bitRes ==  0x3F00) {
                    bound.selOptions[id] &= ~0x3F00;
                } else {
                    bound.selOptions[id] |= 0x3F00;
                }
            } else if (option == 'XP') {
                if (bound.selOptions[id] & 0x100) {
                    bound.selOptions[id] &= ~0x100;
                } else {
                    bound.selOptions[id] |= 0x100;
                }
            } else if (option == 'XM') {
                if (bound.selOptions[id] & 0x200) {
                    bound.selOptions[id] &= ~0x200;
                } else {
                    bound.selOptions[id] |= 0x200;
                }
            } else if (option == 'YP') {
                if (bound.selOptions[id] & 0x400) {
                    bound.selOptions[id] &= ~0x400;
                } else {
                    bound.selOptions[id] |= 0x400;
                }
            } else if (option == 'YM') {
                if (bound.selOptions[id] & 0x800) {
                    bound.selOptions[id] &= ~0x800;
                } else {
                    bound.selOptions[id] |= 0x800;
                }
            } else if (option == 'ZP') {
                if (bound.selOptions[id] & 0x1000) {
                    bound.selOptions[id] &= ~0x1000;
                } else {
                    bound.selOptions[id] |= 0x1000;
                }
            } else if (option == 'ZM') {
                if (bound.selOptions[id] & 0x2000) {
                    bound.selOptions[id] &= ~0x2000;
                } else {
                    bound.selOptions[id] |= 0x2000;
                }
            }

            $scope.SetDragOptions(name);
        }
    }

    $scope.SetDOFace = function(name, option, unsel) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            var id = unsel ? 0 : 1;
            if (option == 'All') {
                var bitRes = bound.selOptions[id] & 0x3F0000;
                if (bitRes ==  0x3F0000) {
                    bound.selOptions[id] &= ~0x3F0000;
                } else {
                    bound.selOptions[id] |= 0x3F0000;
                }
            } else if (option == 'XP') {
                if (bound.selOptions[id] & 0x10000) {
                    bound.selOptions[id] &= ~0x10000;
                } else {
                    bound.selOptions[id] |= 0x10000;
                }
            } else if (option == 'XM') {
                if (bound.selOptions[id] & 0x20000) {
                    bound.selOptions[id] &= ~0x20000;
                } else {
                    bound.selOptions[id] |= 0x20000;
                }
            } else if (option == 'YP') {
                if (bound.selOptions[id] & 0x40000) {
                    bound.selOptions[id] &= ~0x40000;
                } else {
                    bound.selOptions[id] |= 0x40000;
                }
            } else if (option == 'YM') {
                if (bound.selOptions[id] & 0x80000) {
                    bound.selOptions[id] &= ~0x80000;
                } else {
                    bound.selOptions[id] |= 0x80000;
                }
            } else if (option == 'ZP') {
                if (bound.selOptions[id] & 0x100000) {
                    bound.selOptions[id] &= ~0x100000;
                } else {
                    bound.selOptions[id] |= 0x100000;
                }
            } else if (option == 'ZM') {
                if (bound.selOptions[id] & 0x200000) {
                    bound.selOptions[id] &= ~0x200000;
                } else {
                    bound.selOptions[id] |= 0x200000;
                }
            }

            $scope.SetDragOptions(name);
        }
    }

    $scope.SetDOPlanar = function(name, option, unsel) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            var id = unsel ? 0 : 1;
            if (option == 'All') {
                if (bound.selOptions[id] & 0x1000000) {
                    bound.selOptions[id] &= ~0x1000000;
                } else {
                    bound.selOptions[id] |= 0x1000000;
                }
            }

            $scope.SetDragOptions(name);
        }
    }

    $scope.SetDragOptions = function(name) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            bound.SetDragOptions(bound.selOptions[0],
                                 bound.selOptions[1]);
        }
    }

    $scope.GetDOParentLabelStyle = function(name, option, unsel) {
        var bound = $scope.FindBoundMarker(name);
        var optionNum = Number(option);
        if (bound) {
            if (bound.type == 'Box') {
                var id = unsel ? 0 : 1;
                var bit = bound.selOptions[id] & optionNum;
                if (bit == optionNum) {
                    return {'background':'#6bc7f4'}
                } else {
                    return {'background':'#f2f2f2'}
                }
            }
        }
    }

    $scope.GetDOChildLabelStyle = function(name, option, unsel) {
        var bound = $scope.FindBoundMarker(name);
        var optionNum = Number(option);
        if (bound) {
            if (bound.type == 'Box') {
                var id = unsel ? 0 : 1;
                if (bound.selOptions[id] & optionNum) {
                    return {'background':'#B0E4FE'}
                } else {
                    return {'background':'#FFFFFF'}
                }
            }
        }
    }

    $scope.UpdateDragOptions = function(bound) {
        bound.selOptions = [
            0x0, // Unselected drag options
            0x0  // Selected drag options
        ];

        for (var i=0; i<2; i++) {
            if ($scope.defaultBoundDragOptions[i] & 0xF)
                bound.selOptions[i] |= 0xF;
            else
                bound.selOptions[i] &= ~0xF;

            if ($scope.defaultBoundDragOptions[i] & 0x70)
                bound.selOptions[i] |= 0x70;
            else
                bound.selOptions[i] &= ~0x70;

            if ($scope.defaultBoundDragOptions[i] & 0x3F00)
                bound.selOptions[i] |= 0x3F00;
            else
                bound.selOptions[i] &= ~0x3F00;

            if ($scope.defaultBoundDragOptions[i] & 0x3F0000)
                bound.selOptions[i] |= 0x3F0000;
            else
                bound.selOptions[i] &= ~0x3F0000;

            if ($scope.defaultBoundDragOptions[i] & 0x1000000)
                bound.selOptions[i] |= 0x1000000;
            else
                bound.selOptions[i] &= ~0x1000000;
        }
    }

    $scope.FindBoundMarker = function(name) {
        for (var i=0; i<$scope.boundMarkers.length; i++) {
            if (name == $scope.boundMarkers[i].name)
                return $scope.boundMarkers[i];
        }

        return undefined;
    }

    $scope.AddBoundMarker = function(bound, type) {
        bound.type = type;
        bound.selected = 'NO';
        var uid = $scope.shapeScene.AddBoundMarker(bound, $scope.shapeView);
        bound.id = uid;
        bound.name = bound.id + bound.type;
        bound.selectable = true;

        $scope.boundMarkers.push(bound);
        $scope.currentBoundMarker = bound;
    }

    $scope.AddBoundingBox = function() {
        if ($scope.MyBoundClass == undefined) {
            $scope.ExtendClassInterface();
        }

        if ($scope.model) {
            var idPathArr = new Module.VectorString();
            var box = $scope.model.CalculateBoundingBox(idPathArr);

            if (box.valid) {
                var bound = new $scope.MyBoundClass(Module.BoundType.BOX);
                bound.SetBoundingBoxBounds(box.min.x,
                                           box.min.y,
                                           box.min.z,
                                           box.max.x,
                                           box.max.y,
                                           box.max.z);
                // 0x9999B380 : (R 153, G 153, B 179, A 0.5)
                bound.SetBoundingBoxColors(0x9999B380, 0x9999B380,
                                           0x9999B380, 0x9999B380,
                                           0x9999B380, 0x9999B380);
                bound.SetDragOptions($scope.defaultBoundDragOptions[0],
                                     $scope.defaultBoundDragOptions[1]);

                $scope.UpdateDragOptions(bound);

                $scope.AddBoundMarker(bound, "Box");
            } else {
                document.getElementById("bbox").disabled = true;
                document.getElementById("bsphere").disabled = true;
                $scope.useInputbbox = 'YES';
            }
        }
    }
    $scope.CreateBoundingBox = function(create) {
        if (create) {
            var bound = new $scope.MyBoundClass(Module.BoundType.BOX);
            if ($scope.bboxcheck == 'YES') {
                bound.SetBoundingBoxPosition(Number($scope.inputbbox.min.x),
                                             Number($scope.inputbbox.min.y),
                                             Number($scope.inputbbox.min.z),
                                             Number($scope.inputbbox.max.x),
                                             Number($scope.inputbbox.max.y),
                                             Number($scope.inputbbox.max.z));
            } else {
                bound.SetBoundingBoxBounds(Number($scope.inputbbox.min.x),
                                           Number($scope.inputbbox.min.y),
                                           Number($scope.inputbbox.min.z),
                                           Number($scope.inputbbox.max.x),
                                           Number($scope.inputbbox.max.y),
                                           Number($scope.inputbbox.max.z));
            }

            bound.SetDragOptions($scope.defaultBoundDragOptions[0],
                                 $scope.defaultBoundDragOptions[1]);

            $scope.UpdateDragOptions(bound);

            $scope.AddBoundMarker(bound, "Box");
        }

        document.getElementById("bbox").disabled = false;
        document.getElementById("bsphere").disabled = false;
        $scope.useInputbbox = 'NO';
    }

    $scope.AddBoundingSphere = function() {
        if ($scope.MyBoundClass == undefined) {
            $scope.ExtendClassInterface();
        }

        if ($scope.model) {
            var idPathArr = new Module.VectorString();
            var sphere = $scope.model.CalculateBoundingSphere(idPathArr);

            if (sphere.valid) {
                var bound = new $scope.MyBoundClass(Module.BoundType.SPHERE);
                bound.SetBoundingSpherePosition(sphere.center.x,
                                                sphere.center.y,
                                                sphere.center.z,
                                                sphere.radius);
                // 0x9999B380 : (R 153, G 153, B 179, A 0.5)
                bound.SetBoundingSphereColor(0x9999B380);

                $scope.AddBoundMarker(bound, "Sphere");
            } else {
                document.getElementById("bbox").disabled = true;
                document.getElementById("bsphere").disabled = true;
                $scope.useInputbsphere = 'YES';
            }
        }
    }
    $scope.CreateBoundingSphere = function(create) {
        if (create) {
            var bound = new $scope.MyBoundClass(Module.BoundType.SPHERE);
            if ($scope.bboxcheck == 'YES') {
                bound.SetBoundingSpherePosition(Number($scope.inputbsphere.min.x),
                                                Number($scope.inputbsphere.min.y),
                                                Number($scope.inputbsphere.min.z),
                                                Number($scope.inputbsphere.max.x));
            } else {
                bound.SetBoundingSphereBounds(Number($scope.inputbsphere.min.x),
                                              Number($scope.inputbsphere.min.y),
                                              Number($scope.inputbsphere.min.z),
                                              Number($scope.inputbsphere.max.x),
                                              Number($scope.inputbsphere.max.y),
                                              Number($scope.inputbsphere.max.z));
            }

            $scope.AddBoundMarker(bound, "Sphere");
        }

        document.getElementById("bbox").disabled = false;
        document.getElementById("bsphere").disabled = false;
        $scope.useInputbsphere = 'NO';
    }

    $scope.RemoveAllBoundingMarker = function() {
        $scope.shapeScene.RemoveAllBoundMarkers();
        while ($scope.boundMarkers.length) {
            var bound = $scope.boundMarkers.shift();
            if (bound) {
                bound.delete();
                bound = null;
            }
        }
    }

    $scope.RemoveBoundingMarker = function(name) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            $scope.shapeScene.RemoveBoundMarker(bound);
            var bmIndex = -1;
            for (var i=0; i<$scope.boundMarkers.length; i++) {
                if (name == $scope.boundMarkers[i].name) {
                    bmIndex = i;
                    break;
                }
            }
            if (bmIndex > -1) $scope.boundMarkers.splice(bmIndex, 1);
            bound.delete();
            bound = null;
        }
    }

    $scope.UpdateBoundingMarker = function(name) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            if (bound.type == "Box") {
                if ($scope.showBoundBoxInfo == 'YES') {
                    bound.SetBoundingBoxInfo(Number(bound.posx),
                                             Number(bound.posy),
                                             Number(bound.posz),
                                             Number(bound.orix),
                                             Number(bound.oriy),
                                             Number(bound.oriz),
                                             Number(bound.sizex),
                                             Number(bound.sizey),
                                             Number(bound.sizez));
                } else {
                    bound.SetBoundingBoxBounds(Number(bound.minx),
                                               Number(bound.miny),
                                               Number(bound.minz),
                                               Number(bound.maxx),
                                               Number(bound.maxy),
                                               Number(bound.maxz));
                }
            } else if (bound.type == "Sphere") {
                bound.SetBoundingSpherePosition(Number(bound.cenx),
                                                Number(bound.ceny),
                                                Number(bound.cenz),
                                                Number(bound.radius));
            }
        }
    }
    $scope.SetBoundMarkerSelectable = function(name, sel) {
        var bound = $scope.FindBoundMarker(name);
        if (bound) {
            bound.selectable = sel;
            bound.SetSelectable(sel);
        }
    }
    $scope.SelectBoundMarker = function(item) {
        if ($scope.model) {
            $scope.SafeApply(function() {
                $scope.model.SelectBoundMarker(item.id, item.selected == 'YES');
            });
        }
    }

    $scope.DisableBoundMarkerSelection = function() {
        for (let i=0; i<$scope.boundMarkers.length; i++) {
            $scope.boundMarkers[i].SetSelectable(false);
        }
    }
    $scope.RestoreBoundMarkerSelection = function() {
        for (let i=0; i<$scope.boundMarkers.length; i++) {
            $scope.boundMarkers[i].SetSelectable($scope.boundMarkers[i].selectable);
        }
    }

    $scope.UpdateBoundState = function(bound) {
        if (!bound) return;

        var res = bound.GetBoundDimension();
        var strArr = res.split(" ");

        if (bound.type == "Box") {
            if (strArr.length == 6) {
                bound.minx = Number(strArr[0]).toFixed(6);
                bound.miny = Number(strArr[1]).toFixed(6);
                bound.minz = Number(strArr[2]).toFixed(6);

                bound.maxx = Number(strArr[3]).toFixed(6);
                bound.maxy = Number(strArr[4]).toFixed(6);
                bound.maxz = Number(strArr[5]).toFixed(6);
            }
        } else if (bound.type == "Sphere") {
            if (strArr.length == 4) {
                bound.cenx = Number(strArr[0]).toFixed(6);
                bound.ceny = Number(strArr[1]).toFixed(6);
                bound.cenz = Number(strArr[2]).toFixed(6);

                bound.radius = Number(strArr[3]).toFixed(6);
            }
        }

        var info = bound.GetBoundBoxInfo();
        if (info.valid) {
            bound.posx = info.position.x.toFixed(6);
            bound.posy = info.position.y.toFixed(6);
            bound.posz = info.position.z.toFixed(6);

            bound.orix = info.orientation.x.toFixed(6);
            bound.oriy = info.orientation.y.toFixed(6);
            bound.oriz = info.orientation.z.toFixed(6);

            bound.sizex = info.size.x.toFixed(6);
            bound.sizey = info.size.y.toFixed(6);
            bound.sizez = info.size.z.toFixed(6);
        }
    }

    $scope.UpdateSpatialFilter = function() {
        if ($scope.currentSpatialFilterBound && $scope.currentSpatialFilterBound.mode == 'Spatial') {
            $scope.SpatialFilterDlgApply($scope.currentSpatialFilterBound);
        }
    }

    $scope.ShowSpatialFilterDialog = function(query) {
        if ($scope.model) {
            if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
                $scope.dialogId = "spatialFilterDlgBox";
                $scope.dialogTitleId = "spatialFilterDlgBoxTitle";

                for (let i=0; i<$scope.boundMarkers.length; i++) {
                    $scope.model.SelectBoundMarker($scope.boundMarkers[i].id, false);
                    $scope.boundMarkers[i].selected == 'NO';
                }

                $scope.DisableBoundMarkerSelection();
                document.getElementById("bbox").disabled = true;
                document.getElementById("bsphere").disabled = true;

                if (query) {
                    $scope.CreateSpatialFilterBoundMarker(query);
                } else {
                    $scope.spatialFilterResult.filteredItemsNum = 0;
                    $scope.spatialFilterResult.filteredItems = [];
                    $scope.spatialFilterResult.query = {};

                    $scope.CreateSpatialFilterBoundMarker();
                }

                $scope.CheckSpatialFilterPreview();
                $scope.showDialog();
            }
        }
    }

    $scope.CreateSpatialFilterBoundMarker = function(query) {
        if ($scope.MyBoundClass == undefined) {
            $scope.ExtendClassInterface();
        }

        let type;
        if (query) {
            type = query.type;
        } else {
            type = $scope.spatialFilterLocalTo;
        }

        var bound;
        if (type == 'Box') {
            if (query) {
                bound = $scope.CreateSpatialFilterBox(query.minx, query.miny, query.minz,
                                                      query.maxx, query.maxy, query.maxz);
            } else {
                var idPathArr = new Module.VectorString();
                var box = $scope.model.CalculateBoundingBox(idPathArr);

                if (box.valid) {
                    bound = $scope.CreateSpatialFilterBox(box.min.x, box.min.y, box.min.z,
                                                          box.max.x, box.max.y, box.max.z);
                }
            }
        } else if (type == 'Sphere') {
            if (query) {
                bound = $scope.CreateSpatialFilterSphere(query.cenx, query.ceny, query.cenz,
                                                         query.radius);
            } else {
                var idPathArr = new Module.VectorString();
                var sphere = $scope.model.CalculateBoundingSphere(idPathArr);

                if (sphere.valid) {
                    bound = $scope.CreateSpatialFilterSphere(sphere.center.x,
                                                             sphere.center.y,
                                                             sphere.center.z,
                                                             sphere.radius);
                }
            }
        }

        $scope.SpatialFilterDlgApply(bound);
    }

    $scope.CreateSpatialFilterBox = function(x1, y1, z1, x2, y2, z2) {
        var bound = new $scope.MyBoundClass(Module.BoundType.BOX);
        bound.SetBoundingBoxBounds(x1, y1, z1, x2, y2, z2);
        bound.SetBoundingBoxColors(0xBBBBBB40, 0xBBBBBB40,
                                   0xBBBBBB40, 0xBBBBBB40,
                                   0xBBBBBB40, 0xBBBBBB40);
        bound.SetDragOptions(0x0003F07, 0x0003F07);

        $scope.UpdateDragOptions(bound);
        bound.type = 'Box';
        bound.mode = 'Spatial';

        var id = $scope.shapeScene.AddBoundMarker(bound, $scope.shapeView);
        bound.id = id;
        $scope.currentSpatialFilterBound = bound;

        return bound;
    }

    $scope.CreateSpatialFilterSphere = function(x, y, z, r) {
        var bound = new $scope.MyBoundClass(Module.BoundType.SPHERE);
        bound.SetBoundingSpherePosition(x, y, z, r);
        bound.SetBoundingSphereColor(0xBBBBBB40);

        bound.type = 'Sphere';
        bound.mode = 'Spatial';

        var id = $scope.shapeScene.AddBoundMarker(bound, $scope.shapeView);
        bound.id = id;
        $scope.currentSpatialFilterBound = bound;

        return bound;
    }

    $scope.SpatialFilterLocalToChanged = function() {
        $scope.RemoveSpatialFilterBoundMarker();
        $scope.CreateSpatialFilterBoundMarker();
        $scope.CheckSpatialFilterPreview();
    }

    $scope.CheckSpatialFilterPreview = function() {
        let check = document.getElementById("spatialFilterPreview").checked;
        if (check) {
            if ($scope.spatialFilterLocalTo == 'Box') {
                $scope.currentSpatialFilterBound.SetBoundingBoxColors(0xBBBBBB40, 0xBBBBBB40,
                                                                      0xBBBBBB40, 0xBBBBBB40,
                                                                      0xBBBBBB40, 0xBBBBBB40);
                $scope.currentSpatialFilterBound.SetDragOptions(0x0003F07, 0x0003F07);
            } else {
                $scope.currentSpatialFilterBound.SetBoundingSphereColor(0xBBBBBB40);
            }
        } else {
            if ($scope.spatialFilterLocalTo == 'Box') {
                $scope.currentSpatialFilterBound.SetBoundingBoxColors(0xFFFFFF00, 0xFFFFFF00,
                                                                      0xFFFFFF00, 0xFFFFFF00,
                                                                      0xFFFFFF00, 0xFFFFFF00);
                $scope.currentSpatialFilterBound.SetDragOptions(0x0, 0x0);
            } else {
                $scope.currentSpatialFilterBound.SetBoundingSphereColor(0xFFFFFF00);
            }
            $scope.model.SelectBoundMarker($scope.currentSpatialFilterBound.id, false);
        }
    }

    $scope.ShowFilterResult = function() {
        $scope.showSecondaryPane = 'YES';
        $scope.activeSecondaryPane = "spatialfilter";

        $scope.DelayedApply(50, function() {
            resizeBody();
        });
    }

    $scope.GetSpatialFilterResultStyle = function(filteredItem) {
        if (filteredItem.selected) {
            return {'background-color':'#B0E4FE'}
        } else if (filteredItem.preselected) {
            return {'background-color':'#f1fbfe'}
        } else {
            return {'background-color':'#FFFFFF'}
        }
    }

    $scope.SpatialFilterResultPreselect = function(filteredItem, preselect) {
        filteredItem.preselected = preselect;

        if (preselect)
            $scope.HighlightPart(filteredItem.id);
        else
            $scope.DehighlightPart(filteredItem.id);
    }

    $scope.SpatialFilterResultSelect = function($event, filteredItem) {
        if (!filteredItem.selected) {
            for (var i = 0; i < $scope.spatialFilterResult.filteredItems.length; i++) {
                $scope.spatialFilterResult.filteredItems[i].selected = false;
            }
            filteredItem.selected = true;
            $scope.SpatialFilterSelectPart(filteredItem.id);
        }

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.SpatialFilterResultZoom = function($event, filteredItem) {
        $scope.ZoomSelected();

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.SpatialFilterSelectPart = function(idpath) {
        $scope.ClearNodeSelection();
        if ($scope.model) {
            $scope.nodeSelection.push(idpath);
            $scope.model.SelectPart(idpath, true, Module.SelectionList.PRIMARYSELECTION);
        }
    }

    $scope.SpatialFilterResultClearSelection = function(event) {
        $scope.ClearNodeSelection();
        for (var i = 0; i < $scope.spatialFilterResult.filteredItems.length; i++) {
                $scope.spatialFilterResult.filteredItems[i].selected = false;
                $scope.spatialFilterResult.filteredItems[i].preselected = false;
            }

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.RemoveSpatialFilterBoundMarker = function() {
        $scope.shapeScene.RemoveBoundMarker($scope.currentSpatialFilterBound);
        $scope.currentSpatialFilterBound.delete();
        $scope.currentSpatialFilterBound = null;
    }

    $scope.SpatialFilterDlgApply = function(bound) {
        if (bound) {
            if ($scope.spatialFilterLocalTo == 'Box') {
                $scope.shapeScene.SpatialFilterBoxWithCallback(
                    Number(bound.minx),
                    Number(bound.miny),
                    Number(bound.minz),
                    Number(bound.maxx),
                    Number(bound.maxy),
                    Number(bound.maxz),
                    false,//$scope.spatialFilterSearchMode == "Accurate",
                    $scope.spatialFilterItemsIncluded == "YES" /*Contained only*/,
                    function(success, ids) {
                        if (success) {
                            $scope.SaveSpatialFilterQuery(bound);
                            $scope.HighlightSpatialFiltered(ids);
                        } else {
                            console.log('Spatial Filter Failed!');
                        }
                    }
                );
            } else {
                $scope.shapeScene.SpatialFilterSphereWithCallback(
                    Number(bound.cenx),
                    Number(bound.ceny),
                    Number(bound.cenz),
                    Number(bound.radius),
                    false,//$scope.spatialFilterSearchMode == "Accurate",
                    $scope.spatialFilterItemsIncluded == "YES" /*Contained only*/,
                    function(success, ids) {
                        if (success) {
                            $scope.SaveSpatialFilterQuery(bound);
                            $scope.HighlightSpatialFiltered(ids);
                        } else {
                            console.log('Spatial Filter Failed!');
                        }
                    }
                );
            }
        }
    }

    $scope.SaveSpatialFilterQuery = function(bound) {
        let obj = {type: $scope.spatialFilterLocalTo};
        if ($scope.spatialFilterLocalTo == 'Box') {
            obj.minx = Number(bound.minx);
            obj.miny = Number(bound.miny);
            obj.minz = Number(bound.minz);
            obj.maxx = Number(bound.maxx);
            obj.maxy = Number(bound.maxy);
            obj.maxz = Number(bound.maxz);
        } else {
            obj.cenx = Number(bound.cenx);
            obj.ceny = Number(bound.ceny);
            obj.cenz = Number(bound.cenz);
            obj.radius = Number(bound.radius);
        }
        $scope.spatialFilterResult.query = obj;
    }

    $scope.HighlightSpatialFiltered = function(ids) {
        $scope.model.SetPartRenderMode("/", Module.PartRenderMode.PHANTOM, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
        $scope.model.UnsetPartColor("/", Module.ChildBehaviour.INCLUDE);

        $scope.spatialFilterResult.filteredItemsNum = ids.size();
        $scope.spatialFilterResult.filteredItems = [];
        for (let i=0;i<$scope.spatialFilterResult.filteredItemsNum;i++) {
            let idpath = ids.get(i);
            $scope.model.SetPartRenderMode(idpath, Module.PartRenderMode.SHADED, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
            $scope.model.SetPartColor(idpath, 0.38, 1.0, 1.0, 1.0, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
            let instanceName = decode_utf8($scope.structure.GetInstanceName(idpath));
            $scope.spatialFilterResult.filteredItems.push({id: idpath, name: instanceName, selected: false, preselected: false});
        }
    }

    $scope.SpatialFilterDlgClose = function() {
        $scope.RemoveSpatialFilterBoundMarker();
        $scope.RestoreBoundMarkerSelection();
        $scope.model.SetPartRenderMode("/", Module.PartRenderMode.SHADED, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
        $scope.model.UnsetPartColor("/", Module.ChildBehaviour.INCLUDE);
        document.getElementById("bbox").disabled = false;
        document.getElementById("bsphere").disabled = false;
        $scope.hideDialog();
    }

    $scope.ResetPVSUrl = function(success) {
        if (success) {
            storeRecentPVSUrl($scope.pvsUrl);
        }

        $scope.pvsUrl = $scope.pvsBaseUrl;
    }

    $scope.LoadPVS = function(key) {
        $scope.ModelsMenuVisible = false;
        if (key != undefined) {
            if (dbRecentPVSURL == undefined) return;
            dbRecentPVSURL.transaction("RecentPVSURLObjectStore", "readwrite").objectStore("RecentPVSURLObjectStore").openCursor().onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.name == key) {
                        var updateData = cursor.value;
                        updateData.timestamp = Math.floor(Date.now() / 1000);

                        for (let i=0; i<$scope.availablePVSUrls.length;i++) {
                            if ($scope.availablePVSUrls[i].name == key) {
                                $scope.availablePVSUrls[i].timestamp = updateData.timestamp;
                                break;
                            }
                        }

                        $scope.LoadModel(updateData.url);
                        cursor.update(updateData);
                        return;
                    }

                    cursor.continue();
                }
            };
        } else {
            $scope.LoadModel($scope.pvsUrl);
        }
    }

    $scope.LoadPVSKeyPressed = function(event) {
        if (event.keyCode == 13) { // Return key
            $scope.LoadPVS();
        } else if (event.keyCode == 27) { // ESC key
            $scope.ModelsMenuVisible = false;
            $scope.pvsUrl = $scope.pvsBaseUrl;
        }
    }

    $scope.LoadModel = function(url, arrayBuffer) {
        if(ThingView.IsPDFSession() || ThingView.IsSVGSession()){
            $scope.viewType = null;
            $scope.viewExtension = "";
            ThingView.Destroy2DCanvas();
            ThingView.Show3DCanvas($scope.session);
            ThingView._completeInit();
        }
        $scope.viewType = null;
        $scope.viewExtension = "";
        $scope.view3D = true;
        $scope.loadTime = 0;
        if (url || $scope.modelParams.url) {
            if ($scope.MyModelClass == undefined) {
                $scope.ExtendClassInterface();
            }

            $scope.loadState = "Loading";
            $scope.currentDocument = null;
            $scope.currentArrayBuffer = arrayBuffer;

            if ($scope.webglSettings.removeModelsOnLoad === "YES")
                $scope.RemoveAllModels();
            var model = $scope.shapeScene.MakeModel();
            model.type = "Model";
            model.id = $scope.nextModelId;
            model.name = model.type + model.id;
            model.$scope = $scope;
            $scope.models[model.name] = model;
            $scope.model = model;

            if (url)
                $scope.modelParams.url = url;
            /*$scope.StopTimer();
            $scope.SetTimer();*/

            function printErrorStack(errorStack) {
                for (var i=0;i<errorStack.size();i++) {
                    var error = errorStack.get(i);
                    console.error('Error [' + error.number + '] ' + error.name + ' - ' + error.message);
                }
            }

            function loadStructure() {
                $scope.model.LoadStructure(
                    $scope.structure,
                    $scope.webglSettings.autoload == 'YES', // if true, run autoload to load 3D content
                    false, // if true, include parts marked hidden in the structure
                    function(success, isStructure, errorStack){
                        if (success === true) {
                            if (isStructure === true) {
                                $scope.StructuerLoadComplete();
                            } else {
                                $scope.ModelLoadComplete();
                            }
                        } else {
                            printErrorStack(errorStack);
                            $scope.StopTimer();
                            $scope.loadState = "Failed";
                            $scope.ResetPVSUrl(false);
                        }
                    }
                );
            }

            $scope.startTime = performance.now();
            if (arrayBuffer) {
                $scope.structure = $scope.session.LoadStructureWithDataSource(
                    $scope.modelParams.url,
                    arrayBuffer,
                    $scope.webglSettings.autoload == 'YES', // if true, load all the structures linked to this structure
                    function(success, errorStack) {
                        if (success) {
                            loadStructure();
                        } else {
                            printErrorStack(errorStack);
                        }
                    }
                );
            } else {
                $scope.structure = $scope.session.LoadStructureWithURL(
                    $scope.modelParams.url,
                    $scope.webglSettings.autoload == 'YES', // if true, load all the structures linked to this structure
                    function(success, errorStack) {
                        if (success) {
                            loadStructure();
                        } else {
                            printErrorStack(errorStack);
                        }
                    }
                );
            }
            /*if ($scope.webglSettings.showProgress == "YES") {
                $scope.timer = $timeout(function () {
                    $scope.shapeScene.ShowProgress(true);
                }, 250);
            }*/
        } else {
            console.log("src url not set");
        }
    }

    $scope.GetInstanceProperties = function() {
        if ($scope.showBottomPane != 'YES') return;
        if ($scope.activeBottomPane != 'properties') return;

        $scope.instanceProperties = [];
        $scope.propertyNames = [];
        var names = new Set();

        if ($scope.structure) {
            for (let i=0; i<$scope.selection.length; i++) {
                let idPath = $scope.selection[i];
                if (idPath) {
                    let strippedIdpath = $scope.StripModelIdFromIdPath(idPath);
                    let propsJson = $scope.structure.GetInstanceProperties(strippedIdpath);
                    if (propsJson) {
                        let instanceName = decode_utf8($scope.structure.GetInstanceName(strippedIdpath));
                        let propsJsonObj = JSON.parse(propsJson);
                        let propsObj = propsJsonObj[strippedIdpath];
                        if (propsObj) {
                            let keys = Object.keys(propsObj);
                            if (keys.length) {
                                let properties = [];
                                if ($scope.selection.length > 1) {
                                    properties.push({instanceName: instanceName});
                                    properties.push({strippedIdpath: strippedIdpath});
                                }
                                for (let j=0; j<keys.length; j++) {
                                    let groups = propsObj[keys[j]];
                                    Object.keys(groups).forEach(function(key) {
                                        let category = keys[j];

                                        if (category.length == 0)
                                            category = 'PVS File Properties';
                                        else if (category == '__PV_SystemProperties')
                                            category = 'System Properties';

                                        if ($scope.selection.length > 1) {
                                            names.add(key);
                                            let prop = {};
                                            prop[key] = decode_utf8(groups[key]);
                                            properties.push(prop);
                                        } else {
                                            let prop = {
                                                name: key,
                                                category: category,
                                                value: decode_utf8(groups[key])
                                            };
                                            properties.push(prop);
                                        }
                                    });
                                }

                                $scope.instanceProperties.push(properties);
                            }
                        }
                    }
                }
            }

            if ($scope.selection.length > 1) {
                names.forEach(function(name) {
                    $scope.propertyNames.push(name);
                });

                $scope.propertyNames.sort(function(a, b) {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                });
            }
        }
    }

    $scope.FindInstancesWithProperty = function () {
        if ($scope.propertyFindValue) {
            if ($scope.structure) {
                let propValueArr = new Module.VectorString();
                propValueArr.push_back($scope.propertyFindValue);
                $scope.instList = $scope.structure.FindInstancesWithProperties(false, $scope.groupName, $scope.propName, propValueArr);
                $scope.foundIds = [];

                if ($scope.instList.size() > 0) {
                    $scope.findPropertyResult = "Found " + $scope.instList.size() + " instance(s).";

                    for (let i = 0; i < $scope.instList.size() ; i++) {
                        let id = new Object();
                        id.origId = $scope.instList.get(i);
                        let res = id.origId.replace(/@@PV-AUTO-ID@@/gi, "");
                        id.simpId = res;

                        let strippedIdpath = $scope.StripModelIdFromIdPath(id.origId);
                        let instName = decode_utf8($scope.structure.GetInstanceName(strippedIdpath));
                        id.instName = instName;

                        $scope.foundIds.push(id);
                    }

                    document.getElementById("findPropertyResultInput").style.background = 'lime';
                } else {
                    $scope.findPropertyResult = "Found 0 instances.";
                    document.getElementById("findPropertyResultInput").style.background = 'yellow';
                }
            }
        } else {
            $scope.findPropertyResult = "Put property value to find.";
            document.getElementById("findPropertyResultInput").style.background = 'yellow';
        }
    }

    $scope.ResetPropertiesResults = function(ready) {
        if (ready) {
            $scope.getPropertyResult = "Ready to get property.";
            document.getElementById("getPropertyResultInput").style.background = 'white';

            $scope.setPropertyResult = "Ready to set property.";
            document.getElementById("setPropertyResultInput").style.background = 'white';

            $scope.findPropertyResult = "Ready to find instances.";
            document.getElementById("findPropertyResultInput").style.background = 'white';
        } else {
            $scope.getPropertyResult = "Select an item first.";
            document.getElementById("getPropertyResultInput").style.background = 'yellow';

            $scope.setPropertyResult = "Select an item first.";
            document.getElementById("setPropertyResultInput").style.background = 'yellow';
        }

        $scope.propertyGetValue = "";
    }

    $scope.ClearFindResult = function() {
        $scope.DeselectAll(Module.SelectionList.PRESELECTION);
        $scope.foundIds = [];
        $scope.findPropertyResult = "";
        $scope.instList = [];
        $scope.propertyFindValue = "";
    }

    $scope.GetPropertybyName = function(props, name) {
        for (let i=0;i<props.length;i++) {
            let prop = props[i];
            if (prop[name] != undefined) {
                return prop[name];
            }
        }

        return null;
    }

    $scope.EnableConsoleLog = function() {
        (function () {
        var old = console.log;
        var logger = document.getElementById('log');
            console.log = function (message) {
                if (typeof message == 'object') {
                    logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
                } else {
                    logger.innerHTML += message + '<br />';
                }
            }
        })();
    }

    $scope.ExtendClassInterface = function () {
        $scope.MyBoundClass = Module.BoundMarker.extend("BoundMarker", {
            OnLoadComplete: function() {
                var bound = this;
                $scope.SafeApply(function() {
                    $scope.UpdateBoundState(bound);
                });
            },
            OnLoadError: function() {
            },
            OnLocationChanged: function() {
                var bound = this;
                $scope.SafeApply(function() {
                    $scope.UpdateBoundState(bound);
                });
            },
            OnDragEnd: function() {
                $scope.SafeApply(function() {
                    $scope.UpdateSpatialFilter();
                });
            }
        });

        $scope.MyTreeClass = Module.TreeEvents.extend("TreeEvents", {
            OnTreeAddBegin: function () {
                $scope.jsonMessage = [];
            },
            OnTreeAdd: function (message) {
                $scope.jsonMessage.push(message);
            },
            OnTreeAddEnd: function () {
                $scope.ParseTreeAddMessage($scope.jsonMessage);
                console.log($scope.jsonMessage)
                $scope.jsonMessage = [];
                $scope.$apply();
            },
            OnTreeRemoveBegin: function () {
                $scope.jsonMessage = [];
            },
            OnTreeRemove: function (message) {
                $scope.jsonMessage.push(message);
            },
            OnTreeRemoveEnd: function () {
                $scope.ParseTreeRemoveMessage($scope.jsonMessage);
                $scope.jsonMessage = [];
                $scope.$apply();
            },
            OnTreeUpdateBegin: function() {
                $scope.jsonMessage = [];
            },
            OnTreeUpdate: function (message) {
                $scope.jsonMessage.push(message);
            },
            OnTreeUpdateEnd: function() {
                /*$scope.ParseTreeUpdateMessage($scope.jsonMessage);
                alert($scope.jsonMessage)
                $scope.jsonMessage = [];
                $scope.ApplyNodeSelectionList();
                $scope.$apply();*/
            }
        });

         $scope.MySelectionClass = Module.SelectionEvents.extend("SelectionEvents", {
            __construct: function() {
                this.__parent.__construct.call(this);
                this.SetEventsFilter(Module.EventFlags.PICKS.value | Module.EventFlags.SELECTION.value);
            },

            OnSelectionBegin: function () {
                if ($scope.webglSettings.selectionLogging === 'YES') {
                    console.log("OnSelectionBegin");
                }
            },
            OnPicksChanged: function (removed, added, changed) {
                if ($scope.webglSettings.selectionLogging === 'YES') {
                    console.log("OnPicks changed removed:" + removed.size() + " added:" + added.size() + " changed:" + changed.size());
                    for (var i=0;i<added.size();++i) {
                        var pos = this.GetAddedPosition(i);
                        var normal = this.GetAddedNormal(i);
                        if (isNaN(pos.x))
                        {
                            console.log("OnPicksChanged - Added " + added.get(i) + " No position");
                        } else
                        console.log("OnPicksChanged - Added " + added.get(i) + " position " + pos.x + " - " + pos.y + " - " + pos.z + " normal " + normal.x + " - " + normal.y + " - " + normal.z);
                    }
                    for (var i=0;i<changed.size();++i) {
                        var pos = this.GetChangedPosition(i);
                        var normal = this.GetChangedNormal(i);
                        if (isNaN(pos.x))
                        {
                            console.log("OnPicksChanged - Changed " + changed.get(i) + " No position ");
                        } else
                            console.log("OnPicksChanged - Changed " + changed.get(i) + " position " + pos.x + " - " + pos.y + " - " + pos.z + " normal " + normal.x + " - " + normal.y + " - " + normal.z);
                    }
                }
            },
            OnSelectionChanged: function (clear, removed, added) {
                if (!clear && !removed.size() && !added.size()) return;

                $scope.ShowContextMenu(false);
                if (clear) {
                    $scope.selection = [];
                    $scope.nodeSelection = [];
                }

                for (let i=0;i<removed.size();++i) {
                    var idpath = removed.get(i);
                    var fullIdpath = PrependModelId(idpath);
                    let id = $scope.selection.indexOf(fullIdpath);
                    if (id != -1) {
                        $scope.selection.splice(id, 1);
                    }

                    id = $scope.nodeSelection.indexOf(fullIdpath);
                    if (id != -1) {
                        $scope.nodeSelection.splice(id, 1);

                    }
                }

                for (let i=0;i<added.size();++i) {
                    var idpath = added.get(i);
                    var fullIdpath = PrependModelId(idpath);

                    let id = $scope.selection.indexOf(fullIdpath);
                    if (id == -1) {
                        $scope.selection.push(fullIdpath);
                    }

                    id = $scope.nodeSelection.indexOf(fullIdpath);
                    if (id == -1) {
                        $scope.nodeSelection.push(fullIdpath);
                    }
                }

                $scope.UpdateSelectionList();
                $scope.UpdateTreeSelection();
                $scope.SafeApply(function() {
                    $scope.PopulateModelAnnotations();
                    $scope.PopulateLayers();
                });

                if ($scope.webglSettings.selectionLogging === 'YES') {
                    for (var i=0;i<added.size();++i) {
                        var pos = this.GetAddedPosition(i);
                        var normal = this.GetAddedNormal(i);
                        if (isNaN(pos.x))
                        {
                            console.log("OnSelectionChanged Clear: " + clear + " - Added " + added.get(i) + " No position ");
                        } else
                            console.log("OnSelectionChanged Clear: " + clear + " - Added " + added.get(i) + " position " + pos.x + " - " + pos.y + " - " + pos.z+ " normal " + normal.x + " - " + normal.y + " - " + normal.z);
                    }
                }
            },
            OnSelectionEnd: function () {
                if ($scope.webglSettings.selectionLogging === 'YES') {
                    console.log("OnSelectionEnd");
                }
            },
            OnMarkupSelectionChanged: function(clear, removed, added) {
                if (clear) {
                    for (var i=0; i<$scope.boundMarkers.length; i++) {
                        $scope.boundMarkers[i].selected = 'NO';
                    }
                }

                function FindKey (uid) {
                    for (var i=0; i<$scope.boundMarkers.length; i++) {
                        if ($scope.boundMarkers[i].id == uid) {
                            return i;
                        }
                    }

                    return -1;
                }

                for (var i=0;i<removed.size();++i) {
                    var key = FindKey(Number(removed.get(i)));
                    if (key > -1) {
                        $scope.boundMarkers[key].selected = 'NO';
                    }
                }
                for (var i=0;i<added.size();++i) {
                    var key = FindKey(Number(added.get(i)));
                    if (key > -1) {
                        $scope.boundMarkers[key].selected = 'YES';
                        $scope.currentBoundMarker = $scope.boundMarkers[key];
                    }
                }
                $scope.$apply();
            }
        });

        $scope.ModelLoadComplete = function() {
            $scope.loadTime = $scope.GetLoadTime();
            $scope.StopTimer();
            $scope.loadState = "Loaded";
        };

        $scope.StructuerLoadComplete = function() {
           /* $scope.modelLocation = $scope.model.GetLocation();
            $scope.loadedIllustration = "-";
            $scope.viewablesModelDisplay = true;
            $scope.viewablesFiguresDisplay = true;
            $scope.viewablesDocumentsDisplay = true;
            $scope.ResizeFloor();
            $scope.ResetPVSUrl(true);
            $scope.GetViewLocation();
            $scope.PopulateIllustrationData();
            $scope.PopulateDocumentData();
            $scope.PopulateViewStates();
            $scope.PopulateViewOrientations();
            $scope.PopulateModelAnnotations();
            $scope.PopulateLayers();
            $scope.GetProjectionMode();
            $scope.RegisterTreeObserver();
            $scope.RegisterSelectionObserver();

            $scope.model.SetSequenceEventCallback(function(playstate, stepInfo, playpos){
                $scope.HandleSequenceStepResult(playstate, stepInfo, playpos);
                $scope.$apply();
            });
            $scope.model.SetSelectCalloutCallback(function(calloutId, bSelected){
                if ($scope.webglSettings.selectionLogging === 'YES') {
                    console.log("OnSelectCallout: " + calloutId + ", selected: " + bSelected);
                }
                var itemsList =  $scope.model.GetItemsList();
                if (itemsList) {
                    for (var i=0;i<$scope.itemslist.length;++i) {
                        if ($scope.itemslist[i].calloutId == calloutId) {
                            $scope.itemslist[i]["selected"] = bSelected;
                            $scope.$apply();
                            $scope.ToggleTableSelection(i);
                            break;
                        }
                    }
                }
            });

            $scope.model.SetSelectFeatureCallback(function(si, id, selected){
                if ($scope.webglSettings.selectionLogging === 'YES') {
                    console.log("OnSelectFeature: " + id + ", selected: " + selected);
                }
                $scope.SafeApply(function () {
                    $scope.ShowContextMenu(false);
                    $scope.OnFeatureSelection(si.GetInstanceIdPath(), id, selected);
                });
            })

            $scope.model.SetLocationChangeCallback(function(){
                $scope.modelLocation = $scope.model.GetLocation();
                $scope.$apply();
            })

            $scope.model.SetSelectionCallback(function(type, si, idPath, selected, selType){
                // $scope.$apply();
            });*/
            json_string = '{"primaryNode":"3","selectedNodes":null}';
            $scope.session.SelectTreeNodes(json_string, true);

            $scope.$apply();
        };
    }

    $scope.PopulateIllustrationData = function() {
        if ($scope.structure) {
            var annoSets = $scope.structure.GetAnnotationSets();
            $scope.annotationSets = [];
            $scope.annotationSetSelector = "";

            if (annoSets.size() > 0) {
                $scope.annotationSetSelector = annoSets.get(0).name;
                for (var i = 0; i < annoSets.size() ; i++) {
                    annoSetTemp = annoSets.get(i);
                    var annoSet = new Object();
                    annoSet.componentId = annoSetTemp.componentId;
                    annoSet.componentName = annoSetTemp.componentName;
                    annoSet.propertyName = annoSetTemp.propertyName;
                    annoSet.propertyValue = annoSetTemp.propertyValue;
                    annoSet.name = annoSetTemp.name;
                    annoSet.fileName = annoSetTemp.fileName;
                    annoSet.type = annoSetTemp.type;
                    $scope.annotationSets.push(annoSet);
                }
            }

            var illustrations = $scope.structure.GetIllustrations();
            $scope.illustrations = [];
            if (illustrations.size() > 0) {
                for (var i = 0; i < illustrations.size() ; i++) {
                    var illustration = {};
                    illustration.name = illustrations.get(i).name;
                    illustration.humanReadableName = decode_utf8(illustration.name);
                    $scope.illustrations.push(illustration);
                }
            }
            $scope.itemslist = [];

            $scope.ResetSequenceStepInfo();
        }
    }

    $scope.PopulateDocumentData = function () {
        if ($scope.structure) {
            var docs = $scope.structure.GetDocuments();
            $scope.viewablesData = [];

            if (docs.size() > 0) {
                for (var i = 0; i < docs.size() ; i++) {
                    var viewable = docs.get(i);
                    viewable.humanReadableDisplayName = decode_utf8(viewable.displayName);
                    $scope.viewablesData.push(viewable);
                }
            }
        }
    }

    $scope.PopulateViewStates = function () {
        var viewStates = $scope.structure.GetViewStates();
        $scope.viewStates = [];
        if (viewStates.size() > 0) {
            for (var i = 0; i < viewStates.size() ; i++) {
                var vs = new Object();
                vs.viewStateName = viewStates.get(i).name;
                vs.viewStatePath = viewStates.get(i).path;
                vs.humanReadablePath = decode_utf8(viewStates.get(i).humanReadablePath);
                $scope.viewStates.push(vs);
            }
        }
    }

    $scope.PopulateViewOrientations = function() {
        var viewOrients = $scope.structure.GetViewOrientations();
        $scope.viewOrients = [];
        if (viewOrients.size() > 0) {
            var cm = {name: 'CAD Model'};
            $scope.viewOrients.push(cm);
            for (var i = 0; i < viewOrients.size() ; i++) {
                var vo = new Object();
                vo.name = viewOrients.get(i).name;
                vo.orient = viewOrients.get(i).orient;
                $scope.viewOrients.push(vo);
            }
            $scope.orientations = $scope.orientPresets.concat($scope.viewOrients);
        }
    }

    $scope.OnFeatureSelection = function(idpath, id, selected) {
        var features = $scope.featureSelection[idpath];
        if (features) {
            var i = features.indexOf(id);
            if (i == -1) {
                if (selected) features.push(id);
            } else {
                if (!selected) {
                    features.splice(i, 1);
                    if (features.length == 0) {
                        delete $scope.featureSelection[idpath];
                    }
                }
            }
        } else {
            if (selected) {
                var feature = [];
                feature.push(id);
                $scope.featureSelection[idpath] = feature;
            }
        }
    }

    $scope.GetInstanceName = function() {
        if ($scope.structure) {
            if ($scope.selection.length == 1) {
                let strippedIdpath = $scope.StripModelIdFromIdPath($scope.instanceSelector);
                let instName = decode_utf8($scope.structure.GetInstanceName(strippedIdpath));
                if (instName) {
                    $scope.instanceName = instName;
                    $scope.ResetPropertiesResults(true);
                    return;
                }
            }
        }

        $scope.instanceName = "";
        $scope.ResetPropertiesResults(false);
    }

    $scope.PopulateLayers = function() {
        if (!$scope.session || !$scope.model) return;

        $scope.layers = [];
        if ($scope.selection.length == 1) {
            var si = $scope.model.GetShapeInstanceFromIdPath($scope.instanceSelector);
            if (si) {
                $scope.layerTarget = si;
                if ($scope.instanceName) {
                    $scope.layerTargetText = $scope.instanceName;
                } else {
                    $scope.layerTargetText = "Part";
                }
            }
        } else {
            $scope.layerTarget = $scope.session;
            $scope.layerTargetText = "Scene";
        }

        if ($scope.layerTarget) {
            var layers = $scope.layerTarget.GetLayers();
            var overrides = $scope.layerTarget.GetLayerOverrides();

            function GetOverrides(name, overrides) {
                for (var i = 0; i < overrides.size(); i++) {
                    if (overrides.get(i).name == name) {
                        return overrides.get(i).overrides;
                    }
                }
                return undefined;
            }

            for (var i = 0; i < layers.size(); i++) {
                var layer = layers.get(i);
                if (overrides) {
                    var override = GetOverrides(layer.name, overrides);
                    if (override) layer.overrides = override;
                }

                layer.selected = false;
                layer.preselected = false;
                $scope.layers.push(layer);
            }
        }
    }

    $scope.GetLayerID = function(name) {
        return ('LID' + name);
    }

    $scope.GetLayerCheckState = function(layer) {
        var id = 'LID' + layer.name;
        var elem = document.getElementById(id);
        if (elem) {
            if (layer.overrides != undefined) {
                if (layer.overrides & 0x4 /*FORCE_SHOW*/ ||
                    layer.overrides & 0x8 /*FORCE_HIDE*/) {
                    elem.disabled = true;
                } else {
                    elem.disabled = false;
                }

                if (layer.overrides & 0x1 /*VIS_SHOW*/) {
                    elem.indeterminate = false;
                    elem.checked = true;
                    return;
                } else if (layer.overrides & 0x2 /*VIS_HIDE*/) {
                    elem.indeterminate = false;
                    elem.checked = false;
                    return;
                }
            } else {
                elem.disabled = false;
            }

            if (layer.visibility == 1) { // visible
                elem.indeterminate = false;
                elem.checked = true;
            } else if (layer.visibility == 2) { // mixed
                elem.indeterminate = true;
            } else { // 0 hidden
                elem.indeterminate = false;
                elem.checked = false;
            }
        }
    }

    $scope.SetLayerCheckState = function(event, layer) {
        if (layer.overrides != undefined) {
            if (layer.overrides & 0x4 /*FORCE_SHOW*/ ||
                layer.overrides & 0x8 /*FORCE_HIDE*/) {
                return;
            }

            if (layer.overrides & 0x1 /*VIS_SHOW*/) {
                layer.overrides &= ~0x3; //VIS_FLAGS
                layer.overrides |= 0x2 /*VIS_HIDE*/;
            } else if (layer.overrides & 0x2 /*VIS_HIDE*/) {
                layer.overrides &= ~0x3; //VIS_FLAGS
                layer.overrides |= 0x1 /*VIS_SHOW*/;
            }
        } else {
            layer.overrides = 0x0;
            if (layer.visibility != 0) {
                layer.overrides |= 0x2 /*VIS_HIDE*/;
            } else {
                layer.overrides |= 0x1 /*VIS_SHOW*/;
            }
        }

        $scope.ApplyLayersOverrides(false);

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.GetLayerIcon = function(layer) {
        if (layer.overrides & 0x4 /*FORCE_SHOW*/||
            layer.overrides & 0x8 /*FORCE_HIDE*/) {
            return('./icons/layers_force.png');
        } else {
            return('./icons/layers.png');
        }
    }

    $scope.GetLayerIconStyle = function(layer) {
        if (layer.overrides & 0x8 /*FORCE_HIDE*/) {
            return {'opacity': '0.5'}
        } else {
            return {'opacity': '1.0'}
        }
    }

    $scope.GetLayerStyle = function(layer) {
        if (layer.selected) {
            return {'background-color':'#B0E4FE'}
        } else if (layer.preselected) {
            return {'background-color':'#f1fbfe'}
        } else {
            return {'background-color':'#FFFFFF'}
        }
    }

    $scope.GetLayerVisibilityContext = function() {
        if ($scope.selectedLayer != undefined) {
            if ($scope.selectedLayer.overrides & 0x4 /*FORCE_SHOW*/||
                $scope.selectedLayer.overrides & 0x8 /*FORCE_HIDE*/) {
                return false;
            }
            return true;
        }
        return false;
    }

    $scope.LayerClicked = function(event, layer) {
        if (layer.selected) {
            layer.selected = false;
            $scope.selectedLayer = undefined;
        } else {
            for (var i = 0; i < $scope.layers.length; i++) {
                $scope.layers[i].selected = false;
            }
            layer.selected = true;
            $scope.selectedLayer = layer;
        }

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.ClearLayerSelection = function() {
        for (var i = 0; i < $scope.layers.length; i++) {
            $scope.layers[i].selected = false;
        }
        $scope.selectedLayer = undefined;
    }

    $scope.LayerPreselect = function(layer, preselect) {
        layer.preselected = preselect;
    }

    $scope.SetLayerVisibility = function(visibility, force) {
        if ($scope.selectedLayer) {
            var flag = $scope.selectedLayer.overrides;
            if (force) {
                flag &= ~0xC; //FORCE_FLAGS
                flag |= visibility ? 0x4 /*FORCE_SHOW*/ : 0x8 /*FORCE_HIDE*/;
            } else {
                flag &= ~0x3; //VIS_FLAGS
                flag |= visibility ? 0x1 /*VIS_SHOW*/ : 0x2 /*VIS_HIDE*/;
            }
            $scope.selectedLayer.overrides = flag;
            $scope.ApplyLayersOverrides(false);
        }
    }

    $scope.ResetLayerVisibility = function(all) {
        if (all) {
            $scope.ApplyLayersOverrides(true);
        } else {
            if ($scope.selectedLayer) {
                $scope.selectedLayer.overrides = 0x0;
                $scope.ApplyLayersOverrides(false);
                $scope.selectedLayer.overrides = undefined;
            }
        }
    }

    $scope.ApplyLayersOverrides = function(clear) {
        if ($scope.layerTarget) {
            var ors = new Module.LayerOverridesVec();
            for (var i = 0; i < $scope.layers.length; i++) {
                if ($scope.layers[i].overrides != undefined) {
                    if (clear) {
                        ors.push_back({name:$scope.layers[i].name,overrides:0x0});
                        $scope.layers[i].overrides = undefined;
                    } else {
                        ors.push_back({name:$scope.layers[i].name,overrides:$scope.layers[i].overrides});
                    }
                }
            }
            if (ors.size()) {
                $scope.layerTarget.SetLayerOverrides(ors);
            }
        }
    }

    $scope.PopulateModelAnnotations = function() {
        if ($scope.model) {
            var idpaths = [];
            var keys = Object.keys($scope.featureSelection);
            if (keys.length) {
                for (var i=0; i<keys.length; i++) {
                    idpaths.push(keys[i]);
                }
            }

            if ($scope.selection.length) {
                for (var i=0; i<$scope.selection.length ; i++) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath($scope.selection[i]);
                    if (idpaths.indexOf(strippedIdpath) == -1) {
                        idpaths.push(strippedIdpath);
                    }
                }
            }

            var idPathArr = new Module.VectorString();
            for (var i=0; i<idpaths.length; i++) {
                idPathArr.push_back(idpaths[i]);
            }

            $scope.model.GetFeatureInfoHierarchyWithCallback(idPathArr, Module.FeatureType.MARKUP.value | Module.FeatureType.FACE.value, function(phase, stream){
                if (phase == Module.FeatureInfoCallbackPhase.BEGIN) {
                    $scope.jsonMessage = [];
                } else if (phase == Module.FeatureInfoCallbackPhase.INFO) {
                    $scope.jsonMessage.push(stream);
                } else if (phase == Module.FeatureInfoCallbackPhase.END) {
                    $scope.OnPopulateModelAnnotationTree($scope.jsonMessage);
                    $scope.jsonMessage = [];
                    $scope.$apply();
                }
            })
        }
    }

    $scope.OnPopulateModelAnnotationTree = function(messageArr) {
        var res = [];
        for (var i=0; i<messageArr.length; i++) {
            var message_obj = JSON.parse(messageArr[i]);

            if (message_obj.featureInfo) {
                message_obj.featureInfo.info.idpath = message_obj.featureInfo.idpath;
                res.push(message_obj.featureInfo.info);
            }
        }

        if (res.length)
            $rootScope.$emit('PopulateModelAnnotations', {class:'modelannotationsTree', message:res});
    }

    $scope.LoadAnnotationSet = function(annoSet) {
        $scope.ClearNodeSelection();
        $scope.model.ResetToPvkDefault();
        $scope.currentDocument = annoSet.name;
        if(annoSet.propertyName == "document" || annoSet.propertyName == "drawing") {
            $scope.documentScene = $scope.session.MakeDocumentScene();
            $scope.documentScene.LoadPdfAnnotationSet(annoSet.name, $scope.structure, function(success){
                var annotationSetObject = $scope.documentScene.GetPdfAnnotationSet();
                var annotationSet = [];
                for (var i = 0; i < annotationSetObject.size(); i++) {
                    annotationSet.push(annotationSetObject.get(i));
                }
                var documentViewable = $scope.viewablesData[$scope.viewablesData.map(function(viewable){return viewable.name}).indexOf(annoSet.propertyValue)];
                ThingView.LoadPdfAnnotationSet(documentViewable, $scope.sessionId, $scope.documentScene, $scope.structure, annotationSet, function(){
                    ThingView.SetPDFCallback($scope.LoadDocumentCB);
                    $scope.viewType = documentViewable.type;
                    $scope.viewExtension = "pdf";
                    $scope.view3D = false;
                    if($scope.viewType == Module.ViewableType.DOCUMENT){
                        $scope.BuildDocumentBookmarksTree(ThingView.GetPdfBookmarks());
                        var toolbarEnabled = $scope.pdfSettings['toolbarEnabled'] == 'NO' ? false : true;
                        ThingView.SetPdfToolbar($scope.sessionId, toolbarEnabled, null);
                        $scope.LoadDocumentCB(true);
                    }
                });
            });
        } else if ($scope.model){
            $scope.model.LoadAnnotationSetWithCallback(annoSet.name, function(success, name){
                if (success === true)
                    $scope.hasAnimation = $scope.model.HasAnimation();
            });
        }
    }

    $scope.ShowSelectedAnnotations = function(show) {
        if ($scope.model) {
            var keys = Object.keys($scope.featureSelection);
            if (keys.length) {
                for (var i=0; i<keys.length; i++) {
                    var features = $scope.featureSelection[keys[i]];
                    if (features) {
                        var uidArr = new Module.VectorString();
                        for (var j=0; j<features.length; j++) {
                            uidArr.push_back(features[j].toString());
                        }
                        if (show == 'show') {
                            $scope.model.ShowModelAnnotations(keys[i], uidArr);
                        } else if (show == 'hide') {
                            $scope.model.HideModelAnnotations(keys[i], uidArr);
                        }
                    }
                }
            }
        }
    }

    $scope.ShowAllModelAnnotations = function() {
        if ($scope.model) {
            $scope.model.ShowAllModelAnnotations();
        }
    }

    $scope.HideAllModelAnnotations = function() {
        if ($scope.model) {
            $scope.model.HideAllModelAnnotations();
        }
    }

    $scope.LoadIllustration = function(figure) {
        if(ThingView.IsPDFSession() || ThingView.IsSVGSession()){
            ThingView.Destroy2DCanvas();
            $scope.viewType = null;
            $scope.viewExtension = "";
            ThingView.Show3DCanvas($scope.session);
            ThingView._completeInit();
            $scope.viewType = null;
            $scope.viewExtension = "";
            $scope.view3D = true;
        }
        if ($scope.model) {
            $scope.model.StopSequence();
            $scope.ResetSequenceStepInfo();
            $scope.ClearNodeSelection();
            if (figure) {
                $scope.shapeScene.RemoveSectionCut();
                $scope.sectioning = false;
                $scope.sectioningUserCreated = false;
                $scope.currentDocument = figure.humanReadableName;
                $scope.model.LoadIllustrationWithCallback(figure.name, function(success, pviFile, stepInfoVec) {
                    if (success === true) {
                        $scope.ApplyLoadIllustrationResult(name, true, stepInfoVec);
                        $scope.GetProjectionMode();
                    } else {
                        $scope.ApplyLoadIllustrationResult(name, false, null);
                    }
                    $scope.$apply();
                });
            }
        }
    }

    $scope.ApplyLoadIllustrationResult = function(name, success, stepInfoVec) {
        if (success) {
            if ($scope.model) {
                $scope.itemslist = [];
                var itemsList =  $scope.model.GetItemsList();
                if (itemsList) {
                    for (let i=0;i<itemsList.GetNumberOfItems();++i) {
                        var obj = new Object();
                        var calloutId = itemsList.GetItemCalloutId(i);
                        var label = itemsList.GetItemLabel(i);
                        var nameTag = itemsList.GetItemNameTag(i);
                        var qty = itemsList.GetNumInstancesQty(i);
                        obj["calloutId"] = calloutId;
                        obj["label"] = label;
                        obj["nameTag"] = nameTag;
                        obj["quantity"] = qty;
                        obj["selected"] = false;
                        $scope.itemslist.push(obj);
                    }
                }

                $scope.loadedIllustration = name + " is loaded";
                $scope.hasSequence = $scope.model.HasSequence();
                if ($scope.hasSequence) {
                    $scope.curSequenceStep = stepInfoVec.get(0);
                    $scope.curSequenceStep.humanReadableName = decode_utf8($scope.curSequenceStep.name);
					$scope.curSequenceStep.humanReadableDesc = decode_utf8($scope.curSequenceStep.description);
                    $scope.curSequenceStepState = Module.SequencePlayState.STOPPED;
                    $scope.curSequenceStepPosition = Module.SequencePlayPosition.START;

					$scope.stepNames = [];
					$scope.stepDescriptions = [];
					for (var j=0; j<stepInfoVec.size(); ++j)
					{
						$scope.stepNames.push(decode_utf8(stepInfoVec.get(j).name));
						$scope.stepDescriptions.push(decode_utf8(stepInfoVec.get(j).description));
					}
                }
                $scope.hasAnimation = $scope.model.HasAnimation();
            }
        } else {
            $scope.loadedIllustration = "Failed to load " + name;
            $scope.ResetSequenceStepInfo();
        }
    }

    $scope.HandleSequenceStepResult = function (playstate, stepInfo, playpos) {
        $scope.curSequenceStepState = playstate;  // Module.SequencePlayState.PLAYING / PAUSED / STOPPED
		$scope.curSequenceStep = stepInfo;

		if (playstate == Module.SequencePlayState.STOPPED && playpos == Module.SequencePlayPosition.START && 0 != stepInfo.number)
		{
			// don't change the step label to the next one until it actually get played, in order to be consistent with CV behavior
			$scope.curSequenceStep.humanReadableName = $scope.stepNames[stepInfo.number-1];
			$scope.curSequenceStep.humanReadableDesc = $scope.stepDescriptions[stepInfo.number-1];
		}
		else
		{
		    $scope.curSequenceStep.humanReadableName = $scope.stepNames[stepInfo.number];
		    $scope.curSequenceStep.humanReadableDesc = $scope.stepDescriptions[stepInfo.number];
		}

        $scope.curSequenceStepPosition = playpos; // Module.SequencePlayPosition.START / MIDDLE / END

        if (playpos == Module.SequencePlayPosition.START) {
            if ($scope.sequenceNoAck) {
                $scope.sequenceNoAck = false;
            }

            if (stepInfo.number == 0) {
                $scope.sequenceStep = 1;
            } else {
                $scope.sequenceStep = stepInfo.number;
            }
        } else if (playpos == Module.SequencePlayPosition.END) {
            if (stepInfo.acknowledge) {
                if ($scope.sequenceNoAck) {
                    $scope.sequenceNoAck = false;
                    return;
                }

                if (stepInfo.number == 0) {
                    // Continue | Stop
                    if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
                        $scope.dialogId = "seqAckDlgBoxTwoBtn";
                        $scope.dialogTitleId = "seqAckDlgBoxTwoBtnTitle";
                        $scope.firstStep = true;
                        $scope.showDialog();
                    }
                } else if (stepInfo.number == $scope.curSequenceStep.totalSteps - 1) {
                    // Replay | Complete | Stop
                    if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
                        $scope.dialogId = "seqAckDlgBoxThreeBtn";
                        $scope.dialogTitleId = "seqAckDlgBoxThreeBtnTitle";
                        $scope.lastStep = true;
                        $scope.showDialog();
                    }
                } else {
                    // Replay | Continue | Stop
                    if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
                        $scope.dialogId = "seqAckDlgBoxThreeBtn";
                        $scope.dialogTitleId = "seqAckDlgBoxThreeBtnTitle";
                        $scope.lastStep = false;
                        $scope.showDialog();
                    }
                }
            } else {
                if ($scope.playall) {
                    if (stepInfo.number == $scope.curSequenceStep.totalSteps - 1) {
                        $scope.playall = false;
                    } else {
                        if ($scope.model) {
                            $scope.model.GoToSequenceStep(stepInfo.number + 1, Module.SequencePlayPosition.START, true);
                            $scope.sequenceStep = stepInfo.number + 1;
                        }
                    }
                } else {
                    if (stepInfo.number != $scope.curSequenceStep.totalSteps - 1) {
                        $scope.model.GoToSequenceStep(stepInfo.number + 1, Module.SequencePlayPosition.START, false);
                        $scope.sequenceStep = stepInfo.number + 1;
                    }
                }
            }
        }
    }

    $scope.GetCurrentSequenceStepStatus = function() {
        if ($scope.curSequenceStep) {
            let res ="(";
            if ($scope.curSequenceStep.number == 0 &&
                $scope.curSequenceStep.duration == 0) {
                res += '1';
            } else {
                res += $scope.curSequenceStep.number;
            }

            res += ' / ';
            res += $scope.curSequenceStep.totalSteps - 1;
            res += ')';

            return res;
        } else {
            return '( / )';
        }
    }

    $scope.GoToSequenceStep = function() {
        if ($scope.sequenceStep < 1) {
            $scope.sequenceStep = 1;
        } else if ($scope.sequenceStep > $scope.curSequenceStep.totalSteps - 1) {
            $scope.sequenceStep = $scope.curSequenceStep.totalSteps - 1;
        }

        $scope.model.GoToSequenceStep(Number($scope.sequenceStep), Module.SequencePlayPosition.START, false);
    }

    $scope.GetSequenceRewindButtonStatus = function() {
        if (!$scope.hasSequence) return true;

        if ($scope.curSequenceStep.number == 0)
            return true;
        else if ($scope.curSequenceStepState != Module.SequencePlayState.STOPPED)
            return true;

        return false;
    }

    $scope.ShowSequencePlayButton = function() {
        if (!$scope.hasSequence) return false;

        if ($scope.curSequenceStepState == Module.SequencePlayState.PLAYING)
            return false;

        return true;
    }

    $scope.ShowSequencePauseButton = function() {
        if (!$scope.hasSequence) return false;

        if ($scope.curSequenceStepState == Module.SequencePlayState.PLAYING)
            return true;

        return false;
    }

    $scope.GetSequencePlayButtonStatus = function() {
        if (!$scope.hasSequence) return true;

        if ($scope.curSequenceStepState == Module.SequencePlayState.PLAYING)
            return true;
        else if ($scope.curSequenceStep.number == ($scope.curSequenceStep.totalSteps - 1) &&
                 $scope.curSequenceStepPosition == Module.SequencePlayPosition.END)
            return true;

        return false;
    }

    $scope.GetSequencePlayAllButtonStatus = function() {
        if (!$scope.hasSequence) return true;

        if ($scope.curSequenceStepState == Module.SequencePlayState.PLAYING)
            return true;
        else if ($scope.curSequenceStep.number == ($scope.curSequenceStep.totalSteps - 1) &&
                 $scope.curSequenceStepPosition == Module.SequencePlayPosition.END)
            return true;

        return false;
    }

    $scope.GetSequenceNextButtonStatus = function() {
        if (!$scope.hasSequence) return true;

        if ($scope.curSequenceStepState != Module.SequencePlayState.STOPPED)
            return true;
        else if ($scope.curSequenceStep.number == ($scope.curSequenceStep.totalSteps - 1) &&
                 $scope.curSequenceStepPosition == Module.SequencePlayPosition.END)
            return true;

        return false;
    }

    $scope.GetSequencePauseButtonStatus = function() {
        if (!$scope.hasSequence) return true;

        return false;
    }

    $scope.ResetSequenceStepInfo = function() {
        $scope.hasSequence = false;
        $scope.hasAnimation = false;
        $scope.curSequenceStep = null;
        $scope.curSequenceStepPosition = null;
        $scope.curSequenceStepState = null;
        $scope.sequenceStep = 1;
        $scope.playall = false;
    }

    $scope.CheckShapeFilterChildOption = function(id, condition) {
        if (condition) {
            document.getElementById(id).checked = true;
            return 1;
        } else {
            document.getElementById(id).checked = false;
            return 0;
        }
    }

    $scope.CheckShapeFilterParentOption = function(id, count, max) {
        document.getElementById(id).checked = false;
        document.getElementById(id).indeterminate = false;
        if (count == max) {
            document.getElementById(id).checked = true;
            document.getElementById(id).indeterminate = false;
        } else if (count > 0) {
            document.getElementById(id).indeterminate = true;
        }
    }

    $scope.ShowShapeFiltersDialog = function() {
        if (!$scope.shapeScene) return;
        if ($scope.dialogId != "" || $scope.dialogTitleId != "") return;

        var filters = $scope.shapeScene.GetShapeFilters();

        // Model Geometry
        var count = 0;
        count += $scope.CheckShapeFilterChildOption('sfMGSolids',    filters & 0x1);
        count += $scope.CheckShapeFilterChildOption('sfMGSurfaces',  filters & 0x2);
        count += $scope.CheckShapeFilterChildOption('sfMGCosmetics', filters & 0x4);
        $scope.CheckShapeFilterParentOption('sfModelGeometry', count, 3);

        // Model Annotations
        count = 0;
        count += $scope.CheckShapeFilterChildOption('sfMAPlanarAnnotations',   filters & 0x100000);
        count += $scope.CheckShapeFilterChildOption('sfMAFloatingAnnotations', filters & 0x200000);
        count += $scope.CheckShapeFilterChildOption('sfMAMiscAnnotations',     filters & 0x400000);
        count += $scope.CheckShapeFilterChildOption('sfMAScreenAnnotations',   filters & 0x800000);
        count += $scope.CheckShapeFilterChildOption('sfMAHiddenByDefault',     filters & 0x1000000);
        $scope.CheckShapeFilterParentOption('sfModelAnnotations', count, 5);

        // Model Construction Geometry
        count = 0;
        count += $scope.CheckShapeFilterChildOption('sfMCGSurfaces',     filters & 0x100);
        count += $scope.CheckShapeFilterChildOption('sfMCGCosmetics',    filters & 0x200);
        count += $scope.CheckShapeFilterChildOption('sfMCGDatumPlanes',  filters & 0x400);
        count += $scope.CheckShapeFilterChildOption('sfMCGDatumCurves',  filters & 0x800);
        count += $scope.CheckShapeFilterChildOption('sfMCGDatumAxes',    filters & 0x1000);
        count += $scope.CheckShapeFilterChildOption('sfMCGDatumPoints',  filters & 0x2000);
        count += $scope.CheckShapeFilterChildOption('sfMCGCoordSystems', filters & 0x4000);
        $scope.CheckShapeFilterParentOption('sfModelConstructionGeometry', count, 7);

        $scope.dialogId = "shapeFiltersDlgBox";
        $scope.dialogTitleId = "shapeFiltersDlgBoxTitle";
        $scope.showDialog();
    }
    $scope.ShapeFiltersDlgOK = function(hide) {
        if (hide) {
            $scope.hideDialog();
        }

        if (!$scope.shapeScene) return;

        var shapeFilters = 0;
        if (document.getElementById('sfMGSolids').checked)    shapeFilters |= 0x1;
        if (document.getElementById('sfMGSurfaces').checked)  shapeFilters |= 0x2;
        if (document.getElementById('sfMGCosmetics').checked) shapeFilters |= 0x4;

        if (document.getElementById('sfMAPlanarAnnotations').checked)   shapeFilters |= 0x100000;
        if (document.getElementById('sfMAFloatingAnnotations').checked) shapeFilters |= 0x200000;
        if (document.getElementById('sfMAMiscAnnotations').checked)     shapeFilters |= 0x400000;
        if (document.getElementById('sfMAScreenAnnotations').checked)   shapeFilters |= 0x800000;
        if (document.getElementById('sfMAHiddenByDefault').checked)     shapeFilters |= 0x1000000;

        if (document.getElementById('sfMCGSurfaces').checked)     shapeFilters |= 0x100;
        if (document.getElementById('sfMCGCosmetics').checked)    shapeFilters |= 0x200;
        if (document.getElementById('sfMCGDatumPlanes').checked)  shapeFilters |= 0x400;
        if (document.getElementById('sfMCGDatumCurves').checked)  shapeFilters |= 0x800;
        if (document.getElementById('sfMCGDatumAxes').checked)    shapeFilters |= 0x1000;
        if (document.getElementById('sfMCGDatumPoints').checked)  shapeFilters |= 0x2000;
        if (document.getElementById('sfMCGCoordSystems').checked) shapeFilters |= 0x4000;

        if ($scope.webglSettings.shapeFilters != shapeFilters) {
            $scope.shapeScene.SetShapeFilters(shapeFilters);
            $scope.webglSettings.shapeFilters = shapeFilters;
            $scope.SaveWebglSettings('shapeFilters');
        }
    }

    $scope.CheckModelGeomParent = function() {
        var check = document.getElementById('sfModelGeometry').checked;
        document.getElementById('sfMGSolids').checked = check;
        document.getElementById('sfMGSurfaces').checked = check;
        document.getElementById('sfMGCosmetics').checked = check;
    }
    $scope.CheckModelGeomChildren = function() {
        var count = 0;
        if (document.getElementById('sfMGSolids').checked) count++;
        if (document.getElementById('sfMGSurfaces').checked) count++;
        if (document.getElementById('sfMGCosmetics').checked) count++;
        $scope.CheckShapeFilterParentOption('sfModelGeometry', count, 3);
    }
    $scope.CheckModelAnnoParent = function() {
        var check = document.getElementById('sfModelAnnotations').checked;
        document.getElementById('sfMAPlanarAnnotations').checked = check;
        document.getElementById('sfMAFloatingAnnotations').checked = check;
        document.getElementById('sfMAMiscAnnotations').checked = check;
        document.getElementById('sfMAScreenAnnotations').checked = check;
        document.getElementById('sfMAHiddenByDefault').checked = check;
    }
    $scope.CheckModelAnnoChildren = function() {
        var count = 0;
        if (document.getElementById('sfMAPlanarAnnotations').checked) count++;
        if (document.getElementById('sfMAFloatingAnnotations').checked) count++;
        if (document.getElementById('sfMAMiscAnnotations').checked) count++;
        if (document.getElementById('sfMAScreenAnnotations').checked) count++;
        if (document.getElementById('sfMAHiddenByDefault').checked) count++;
        $scope.CheckShapeFilterParentOption('sfModelAnnotations', count, 5);
    }
    $scope.CheckModelConstGeomParent = function() {
        var check = document.getElementById('sfModelConstructionGeometry').checked;
        document.getElementById('sfMCGSurfaces').checked = check;
        document.getElementById('sfMCGCosmetics').checked = check;
        document.getElementById('sfMCGDatumPlanes').checked = check;
        document.getElementById('sfMCGDatumCurves').checked = check;
        document.getElementById('sfMCGDatumAxes').checked = check;
        document.getElementById('sfMCGDatumPoints').checked = check;
        document.getElementById('sfMCGCoordSystems').checked = check;
    }
    $scope.CheckModelConstGeomChildren = function() {
        var count = 0;
        if (document.getElementById('sfMCGSurfaces').checked) count++;
        if (document.getElementById('sfMCGCosmetics').checked) count++;
        if (document.getElementById('sfMCGDatumPlanes').checked) count++;
        if (document.getElementById('sfMCGDatumCurves').checked) count++;
        if (document.getElementById('sfMCGDatumAxes').checked) count++;
        if (document.getElementById('sfMCGDatumPoints').checked) count++;
        if (document.getElementById('sfMCGCoordSystems').checked) count++;
        $scope.CheckShapeFilterParentOption('sfModelConstructionGeometry', count, 7);
    }

    $scope.showDialog = function() {
        document.getElementById($scope.dialogId).style.display = "block";
        document.getElementById($scope.dialogId).style.top = "10%";
        document.getElementById($scope.dialogId).style.left = "20%";
        document.getElementById($scope.dialogTitleId).onmousedown = function() {
            _dialog_drag_init(this.parentNode);
            return false;
        };

        document.onmousemove = _dialog_move_elem;
        document.onmouseup = _dialog_destroy;
    }
    $scope.hideDialog = function() {
        document.getElementById($scope.dialogId).style.display = "none";
        $scope.dialogId = "";
        $scope.dialogTitleId = "";
    }
    $scope.seqDlgReplay = function() {
        $scope.hideDialog();
        if ($scope.model) {
            $scope.model.GoToSequenceStep($scope.curSequenceStep.number, Module.SequencePlayPosition.START, true);
        }
    }
    $scope.seqDlgContinue = function() {
        $scope.hideDialog();
        if ($scope.firstStep) {
            $scope.firstStep = false;
            if ($scope.model) {
                $scope.model.GoToSequenceStep($scope.curSequenceStep.number + 1, Module.SequencePlayPosition.START, true);
            }
        } else if ($scope.playall) {
            if ($scope.model) {
                $scope.model.GoToSequenceStep($scope.curSequenceStep.number + 1, Module.SequencePlayPosition.START, true);
            }
        }
    }
    $scope.seqDlgComplete = function() {
        $scope.hideDialog();
        $scope.playall = false;
        $scope.lastStep = false;
    }
    $scope.seqDlgStop = function() {
        $scope.hideDialog();
        $scope.playall = false;
    }

    $scope.SetSequenceCmd = function (cmd) {
        if (!$scope.model) return;

        if (cmd == 'Rewind') {
            $scope.model.GoToSequenceStep(0, Module.SequencePlayPosition.START, false);
            $scope.sequenceStep = 1;
        }
        else if (cmd == 'Previous Step') {
            if ($scope.curSequenceStep.number == $scope.curSequenceStep.totalSteps - 1 &&
                $scope.curSequenceStepPosition == Module.SequencePlayPosition.END) {
                if ($scope.curSequenceStep.number == 1) {
                    $scope.model.GoToSequenceStep(0, Module.SequencePlayPosition.START, false);
                    $scope.sequenceStep = 1;
                } else {
                    $scope.model.GoToSequenceStep($scope.curSequenceStep.number, Module.SequencePlayPosition.START, false);
                }

                $scope.sequenceNoAck = true;
            } else {
                if ($scope.curSequenceStep.number > 0) {
                    let numberToGo = $scope.curSequenceStep.number - 1;
                    if (numberToGo == 1) {
                        $scope.model.GoToSequenceStep(0, Module.SequencePlayPosition.START, false);
                    } else {
                        $scope.model.GoToSequenceStep(numberToGo, Module.SequencePlayPosition.START, false);
                    }

                    if (numberToGo == 0) {
                        $scope.sequenceStep = 1;
                    } else {
                        $scope.sequenceStep = numberToGo;
                    }

                    $scope.sequenceNoAck = true;
                }
            }
        }
        else if (cmd == 'Play') {
            $scope.playall = false;
            $scope.model.PlaySequenceStepWithCallback(function(step){

            })
        }
        else if (cmd == 'Play All') {
            $scope.playall = true;
            $scope.model.PlaySequenceStepWithCallback(function(step){
            })
        }
        else if (cmd == 'Next Step') {
            if ($scope.curSequenceStep.number == $scope.curSequenceStep.totalSteps - 1 &&
                $scope.curSequenceStepPosition == Module.SequencePlayPosition.START) {
                $scope.model.GoToSequenceStep($scope.curSequenceStep.number, Module.SequencePlayPosition.END, false);
                $scope.sequenceNoAck = true;
            } else if ($scope.curSequenceStep.number == 0) {
                $scope.model.GoToSequenceStep(1, Module.SequencePlayPosition.END, false);
                $scope.sequenceNoAck = true;
            } else {
                if ($scope.curSequenceStep.number < $scope.curSequenceStep.totalSteps - 1) {
                    $scope.model.GoToSequenceStep($scope.curSequenceStep.number + 1, Module.SequencePlayPosition.START, false);
                    $scope.sequenceStep = $scope.curSequenceStep.number + 1;
                    $scope.sequenceNoAck = true;
                }
            }
        }
        else if (cmd == 'Pause') {
            $scope.model.PauseSequence();
        }
        else if (cmd == 'Stop') {
            $scope.playall = false;
            $scope.sequenceStep = 1;
            $scope.model.StopSequence();
        }
        else if (cmd == 'GoTo') {
            $scope.GoToSequenceStep();
        }
    };
    $scope.SetAnimationCmd = function (cmd) {
        if (!$scope.model) return;

        if (cmd == 'PlayAnimation') {
            $scope.model.SetPlaybackSpeed(Number($scope.animationSpeed));
            $scope.model.PlayAnimation();
        }
        else if (cmd == 'PauseAnimation') {
            $scope.model.PauseAnimation();
        }
        else if (cmd == 'StopAnimation') {
            $scope.model.StopAnimation();
        }
    };

    $scope.SetAnimationSpeed = function() {
        if ($scope.model) {
            $scope.model.SetPlaybackSpeed(Number($scope.animationSpeed));
        }
    };

    $scope.ContextStructureMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'Hide') {
            $scope.SetVisibility(false, false);
        } else if (cmd == 'Show') {
            $scope.SetVisibility(true, false);
        } else if (cmd == 'ShowAll') {
            $scope.SetVisibility(true, true);
        } else if (cmd == 'Isolate') {
            $scope.Isolate();
        } else if (cmd == 'Unload') {
            $scope.Unload();
        } else if (cmd == 'Expand') {
            $scope.ExpandChildren(true);
        } else if (cmd == 'Collapse') {
            $scope.ExpandChildren(false);
        } else if (cmd == 'ZoomAll') {
            $scope.ZoomView();
        } else if (cmd == 'ZoomSel') {
            $scope.ZoomSelected();
        } else if (cmd == 'Properties') {
            $scope.OpenPropertiesDlg();
        } else if (cmd == 'Remove') {
            $scope.RemoveComps();
        } else if (cmd == 'InsertBranch') {
            $scope.InsertBranch();
        } else if (cmd == 'CreateComp') {
            $scope.CreateComp();
        } else if (cmd == 'Phantom') {
            $scope.SetRenderMode(cmd);
        } else if (cmd == 'Shaded') {
            $scope.SetRenderMode(cmd);
        } else if (cmd == 'UnSetRM') {
            $scope.UnsetRenderMode();
        } else if (cmd == 'Transparent1_0') {
            $scope.SetOpacity(0.0);
        } else if (cmd == 'Transparent0_5') {
            $scope.SetOpacity(0.5);
        } else if (cmd == 'UnSetT') {
            $scope.UnsetOpacity();
        } else if (cmd == 'LoadParts') {
            $scope.LoadParts();
        } else if (cmd == 'CustomSelect1') {
            $scope.ApplyCustomSelect(1);
        } else if (cmd == 'CustomSelect2') {
            $scope.ApplyCustomSelect(2);
        } else if (cmd == 'CustomSelect3') {
            $scope.ApplyCustomSelect(3);
        } else if (cmd == 'CustomSelect4') {
            $scope.ApplyCustomSelect(4);
        } else if (cmd == 'CustomSelect5') {
            $scope.ApplyCustomSelect(5);
        } else if (cmd == 'CustomUnSelectAll') {
            $scope.ApplyCustomSelect(0);
        } else if (cmd == 'ShadowCastOff') {
            $scope.SetShadowCast(false);
        } else if (cmd == 'UnsetShadowCast') {
            $scope.UnsetShadowCast();
        }
    }

    $scope.ContextAnnotationMenu = function (cmd) {
        $scope.ShowContextMenu(false);
    }

    $scope.ContextFeatureMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'Show') {
            $scope.ShowSelectedAnnotations('show');
        } else if (cmd == 'Hide') {
            $scope.ShowSelectedAnnotations('hide');
        } else if (cmd == 'Isolate') {
            var keys = Object.keys($scope.featureSelection);
            if (keys.length) {
                $scope.HideAllModelAnnotations();
                $scope.ShowSelectedAnnotations('show');
            }
        } else if (cmd == 'Restore') {

        } else if (cmd == 'ShowAll') {
            $scope.ShowAllModelAnnotations();
        } else if (cmd == 'HideAll') {
            $scope.HideAllModelAnnotations();
        } else if (cmd == 'ShowMarkupId') {
            if (!$scope.model) return;

            var keys = Object.keys($scope.featureSelection);
            if (keys.length) {
                if (keys.length) {
                    for (var i=0; i<keys.length; i++) {
                        var features = $scope.featureSelection[keys[i]];
                        if (features) {
                            var modelAnnoMsg = "";
                            for (var j=0; j<features.length; j++) {
                                var props = $scope.model.GetMarkupFeatureProperties(keys[i], features[j]);
                                console.log("Model annnotation json object: \n" + props);
                                var markupId = $scope.model.GetMarkupFeatureId(keys[i], features[j]);
                                var uniqueId = $scope.model.GetMarkupFeatureUniqueId(keys[i], markupId);
                                modelAnnoMsg += "Selected UID: " + features[j].toString() + ", markup feature id: " + markupId + ", unique id from markup id: " + uniqueId + "\n";
                            }
                            if (modelAnnoMsg !== "")
                                alert(modelAnnoMsg);
                        }
                    }
                }
            }
        } else if (cmd == 'ShowMarkups') {
            $scope.showFeatureMarkups = true;
        } else if (cmd == 'HideMarkups') {
            $scope.showFeatureMarkups = false;
        } else if (cmd == 'ShowFaces') {
            $scope.showFeatureFaces = true;
        } else if (cmd == 'HideFaces') {
            $scope.showFeatureFaces = false;
        }
    }

    $scope.ContextMarkupMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'RemoveLeaderlines') {
            $scope.RemoveLeaderlines();
        } else if (cmd == 'RemoveBoundingBoxes') {
            $scope.RemoveAllBoundingMarker();
        }
    }

    $scope.ContextSelInstancesMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'ClearSelection') {
            $scope.ClearNodeSelection();
        }
    }

    $scope.ContextLayerMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'SetVisible') {
            $scope.SetLayerVisibility(true);
        } else if (cmd == 'SetHidden') {
            $scope.SetLayerVisibility(false);
        } else if (cmd == 'ForceVisible') {
            $scope.SetLayerVisibility(true, true);
        } else if (cmd == 'ForceHidden') {
            $scope.SetLayerVisibility(false, true);
        } else if (cmd == 'Reset') {
            $scope.ResetLayerVisibility(false);
        } else if (cmd == 'ResetAll') {
            $scope.ResetLayerVisibility(true);
        }
    }

    $scope.ContextSpatialFilterResultsMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'ZoomAll') {
            var idPathArr = new Module.VectorString();
            for (var i=0; i<$scope.spatialFilterResult.filteredItemsNum ; i++) {
                idPathArr.push_back($scope.spatialFilterResult.filteredItems[i].id);
            }

            $scope.shapeView.ZoomToParts(idPathArr);

        } else if (cmd == 'ColorCodeAll') {
            $scope.model.SetPartRenderMode("/", Module.PartRenderMode.PHANTOM, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
            $scope.model.UnsetPartColor("/", Module.ChildBehaviour.INCLUDE);

            for (let i=0;i<$scope.spatialFilterResult.filteredItemsNum;i++) {
                let idpath = $scope.spatialFilterResult.filteredItems[i].id;
                $scope.model.SetPartRenderMode(idpath, Module.PartRenderMode.SHADED, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
                $scope.model.SetPartColor(idpath, 0.38, 1.0, 1.0, 1.0, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
            }
        } else if (cmd == 'ClearColorCode') {
            $scope.model.SetPartRenderMode("/", Module.PartRenderMode.SHADED, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
            $scope.model.UnsetPartColor("/", Module.ChildBehaviour.INCLUDE);
        } else if (cmd == 'ShowQuery') {
            $scope.ShowSpatialFilterDialog($scope.spatialFilterResult.query);
        } else if (cmd == 'ClearResults') {
            $scope.spatialFilterResult.query = {};
            $scope.spatialFilterResult.filteredItemsNum = 0;
            $scope.spatialFilterResult.filteredItems = [];

            $scope.model.SetPartRenderMode("/", Module.PartRenderMode.SHADED, Module.ChildBehaviour.INCLUDE, Module.InheritBehaviour.USE_DEFAULT);
            $scope.model.UnsetPartColor("/", Module.ChildBehaviour.INCLUDE);
        }
    }

    $scope.ContextDocumentMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'Previous') {
            $scope.LoadPrevPage();
        } else if (cmd == 'Next') {
            $scope.LoadNextPage();
        } else if (cmd == 'First') {
            $scope.LoadPage(1);
        } else if (cmd == 'Last') {
            $scope.LoadPage($scope.totalPageNo);
        }
    }

    $scope.ContextPropertyMenu = function (cmd) {
        $scope.ShowContextMenu(false);
        if (cmd == 'SetProperty') {
            $scope.ShowSetPropertyDialog();
        } else if (cmd == 'GetProperty') {
            $scope.ShowGetPropertyDialog();
        } else if (cmd == 'FindProperty') {
            $scope.ShowFindInstancesWithPropertyDialog();
        } else if (cmd == 'ClearFindResult') {
            $scope.ClearFindResult();
        }
    }

    $scope.ShowSetPropertyDialog = function() {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.GetInstanceName();
            $scope.dialogId = "setPropertyDlgBox";
            $scope.dialogTitleId = "setPropertyDlgBoxTitle";
            $scope.propertySetValue = "";
            $scope.showDialog();
        }
    }

    $scope.SetPropertyDlgApply = function() {
        let idPath = $scope.instanceSelector;
        if (idPath) {
            if ($scope.propertySetValue) {
                if ($scope.structure) {
                    let strippedIdpath = $scope.StripModelIdFromIdPath(idPath);
                    $scope.structure.SetPropertyValue(strippedIdpath, $scope.groupName, $scope.propName, $scope.propertySetValue);
                    $scope.setPropertyResult = "Property set.";
                    document.getElementById("setPropertyResultInput").style.background = 'lime';
                    $scope.GetInstanceProperties();
                }
            } else {
                $scope.setPropertyResult = "Put property value to set.";
                document.getElementById("setPropertyResultInput").style.background = 'yellow';
            }
        } else {
            $scope.setPropertyResult = "Select an item first.";
            document.getElementById("setPropertyResultInput").style.background = 'yellow';
        }
    }

    $scope.ShowGetPropertyDialog = function() {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.GetInstanceName();
            $scope.dialogId = "getPropertyDlgBox";
            $scope.dialogTitleId = "getPropertyDlgBoxTitle";
            $scope.propertyGetValue = "";
            $scope.showDialog();
        }
    }

    $scope.GetPropertyDlgApply = function() {
        let value = "";
        let idPath = $scope.instanceSelector;
        if (idPath) {
            if ($scope.structure) {
                let strippedIdpath = $scope.StripModelIdFromIdPath(idPath);
                value = $scope.structure.GetPropertyValue(strippedIdpath, $scope.groupName, $scope.propName);
                if (value.length == 0) {
                    $scope.getPropertyResult = "Got nothing.";
                    document.getElementById("getPropertyResultInput").style.background = 'yellow';
                } else {
                    $scope.getPropertyResult = "Successfully got property.";
                    document.getElementById("getPropertyResultInput").style.background = 'lime';
                }
            }
        } else {
            $scope.getPropertyResult = "Select an item first.";
            document.getElementById("getPropertyResultInput").style.background = 'yellow';
        }

        $scope.propertyGetValue = value;
    }

    $scope.ShowFindInstancesWithPropertyDialog = function() {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.dialogId = "findInstancesWithPropertyDlgBox";
            $scope.dialogTitleId = "findInstancesWithPropertyDlgBoxTitle";
            $scope.propertyFindValue = "";
            $scope.showDialog();
        }
    }

    $scope.ShowLeaderLinePropertiesDialog = function() {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.dialogId = "leaderLinePropertiesDlgBox";
            $scope.dialogTitleId = "leaderLinePropertiesDlgBoxTitle";
            $scope.showDialog();
        }
    }

    $scope.HideLeaderLinePropertiesDialog = function(save) {
        $scope.hideDialog();
        $scope.RestoreBoundMarkerSelection();
        $scope.UpdateSelectionFilter();
        if ($scope.webglSettings.dragMode == 'YES')
            $scope.shapeView.SetDragMode(Module.DragMode.DRAG);
        else
            $scope.shapeView.SetDragMode(Module.DragMode.NONE);
        if (!save) {
            $scope.RemoveCurrentLeaderLine();
        }
        $scope.creatingLeaderLine = false;
        $scope.RemoveLeaderLineListener();
    }

    $scope.GetLeaderlineWidthIcon = function(width) {
        if (width.id == 1) {
            return('./icons/line_width1.png');
        } else if (width.id == 2) {
            return('./icons/line_width2.png');
        } else if (width.id == 3) {
            return('./icons/line_width3.png');
        } else if (width.id == 4) {
            return('./icons/line_width4.png');
        } else if (width.id == 5) {
            return('./icons/line_width5.png');
        } else if (width.id == 6) {
            return('./icons/line_width6.png');
        }
    }

    $scope.GetLeaderlineHeadCapIcon = function(cap) {
        if (cap.id == 1) {
            return('./icons/leader_none.png');
        } else if (cap.id == 2) {
            return('./icons/leader_head_point.png');
        } else if (cap.id == 3) {
            return('./icons/leader_head_round.png');
        }
    }

    $scope.GetLeaderlineTailCapIcon = function(cap) {
        if (cap.id == 1) {
            return('./icons/leader_none.png');
        } else if (cap.id == 2) {
            return('./icons/leader_tail_point.png');
        } else if (cap.id == 3) {
            return('./icons/leader_tail_round.png');
        }
    }

    $scope.GetLeaderLinePointType = function(point) {
        if (point.type == 'WORLD') {
            return 'World';
        } else if (point.type == 'SCREEN') {
            return 'Screen';
        }
    }

    $scope.GetLeaderLinePointPos = function(point) {
        if (point.type == 'WORLD') {
            let res = '(' + point.worldPos.x.toFixed(3) + ', ' + point.worldPos.y.toFixed(3) + ', ' + point.worldPos.z.toFixed(3) + ')';
            return res;
        } else if (point.type == 'SCREEN') {
            let res = '(' + point.screenPos.x + ', ' + point.screenPos.y + ')';
            return res;
        }
    }

    $scope.ShowFeatureMarkups = function() {
        return $scope.showFeatureMarkups;
    }

    $scope.ShowFeatureFaces = function() {
        return $scope.showFeatureFaces;
    }

    $scope.RemoveLeaderlines = function() {
        $scope.shapeScene.DeleteAllLeaderlineMarkers();
        $scope.leaderlines = [];
    }

    $scope.StructureEditOn = function() {
        if ($scope.webglSettings.structureEdit == 'YES') {
            return true;
        } else {
            return false;
        }
    }

    $scope.RemoveComps = function() {
        if (!$scope.model) return;

        var se = $scope.session.GetStructureEdit();
        if (se) {
            var stringSet =  Module.StringSet.Create();
            for (var i=0; i<$scope.nodeSelection.length; i++) {
                var node = $scope.idpathMap[$scope.nodeSelection[i]];
                if (node) {
                    $scope.SetCurrentModel(node.data.modelId);
                    if ($scope.model) {
                        var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                        stringSet.Insert(strippedIdpath);
                    }
                }
            }
            se.RemoveComps(stringSet, true, true, function (success) {
                if (success) {
                    console.log('Successfully removed comps');
                } else {
                    console.log('Failed to remove comps');
                }
            });
        }
    }

    $scope.MarkComps = function() {
        if (!$scope.model) return;

        var se = $scope.session.GetStructureEdit();
        if (se) {
            $scope.markedComps = Module.StringSet.Create();
            var count = 0;
            for (var i=0; i<$scope.nodeSelection.length; i++) {
                var node = $scope.idpathMap[$scope.nodeSelection[i]];
                if (node) {
                    $scope.SetCurrentModel(node.data.modelId);
                    if ($scope.model) {
                        var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                        $scope.markedComps.Insert(strippedIdpath);
                        count++;
                    }
                }
            }
        }
    }

    $scope.InsertBranch = function() {
        if ($scope.nodeSelection.length == 1) {
            if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
                $scope.dialogId = "insertBranchesDlgBox";
                $scope.dialogTitleId = "insertBranchesDlgBoxTitle";
                $scope.ibName = "";
                $scope.ibUrl = "";
                $scope.showDialog();
            }
        } else {
            console.log('Select only one component to insert branch.');
        }
    }

    $scope.CreateComp = function() {
        if ($scope.nodeSelection.length == 1) {
            if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
                $scope.dialogId = "createCompDlgBox";
                $scope.dialogTitleId = "createCompDlgBoxTitle";
                $scope.ccName = "";
                $scope.ccUrl = "";
                $scope.ccId = "";
                $scope.showDialog();
            }
        } else {
            console.log('Select only one component to create component.');
        }
    }

    $scope.SetRecentUrl = function(url) {
        $scope.ibUrl = url;
    }
    $scope.ibDlgInsert = function() {
        $scope.hideDialog();

        var se = $scope.session.GetStructureEdit();
        if (se) {
            var node = $scope.idpathMap[$scope.nodeSelection[0]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);

                    if (strippedIdpath == ':') {
                        // root node
                        console.log('You cannot merge into root node.');
                    } else {
                        var infoVector = Module.IdFileVector.Create();
                        infoVector.InsertIdFile(strippedIdpath, $scope.ibUrl);

                        se.InsertBranchesChildren(infoVector, true, true, function (success) {
                            if (success) {
                                console.log('Successfully merged');
                            } else {
                                console.log('Failed to merge');
                            }
                        });
                        $scope.ClearNodeSelection();

                        if (dbRecentPVS == undefined) return;
                        var dataSet = dbRecentPVS.transaction("RecentPVSObjectStore", "readwrite").objectStore("RecentPVSObjectStore").get($scope.ibUrl);
                        dataSet.onsuccess = function(event) {
                            if (event.currentTarget.result === undefined) {
                                storeRecentUrl($scope.ibUrl);
                            }
                        }
                    }
                }
            }
        }
    }

    $scope.SetRecentShapeSource = function(url) {
        $scope.ccUrl = url;
    }
    $scope.ccDlgInsert = function() {
        $scope.hideDialog();

        var se = $scope.session.GetStructureEdit();
        if (se) {
            var node = $scope.idpathMap[$scope.nodeSelection[0]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);

                    if (strippedIdpath == ':') {
                        // root node
                        console.log('You cannot create component on root node.');
                    } else {
                        se.CreateComp($scope.ccName, strippedIdpath, $scope.ccUrl, $scope.ccId, function (success) {
                            if (success) {
                                console.log('Successfully created component');
                            } else {
                                console.log('Failed to create component');
                            }
                        });
                        $scope.ClearNodeSelection();

                        if (dbRecentShapeSource == undefined) return;
                        var dataSet = dbRecentShapeSource.transaction("RecentShapeSourceObjectStore", "readwrite").objectStore("RecentShapeSourceObjectStore").get($scope.ccUrl);
                        dataSet.onsuccess = function(event) {
                            if (event.currentTarget.result === undefined) {
                                storeRecentShapeSource($scope.ccUrl);
                            }
                        }
                    }
                }
            }
        }
    }

    $scope.SetBackgroundColor = function() {
        if ($scope.shapeView) {
            if ($scope.webglSettings.backgroundColorNum == 'ONE') {
                let color = parseInt($scope.webglSettings.backgroundHexColor.substr(1), 16);
                $scope.shapeView.SetBackgroundColor(color);
            } else if ($scope.webglSettings.backgroundColorNum == 'TWO') {
                let topColor = parseInt($scope.webglSettings.backgroundTopHexColor.substr(1), 16);
                let bottomColor = parseInt($scope.webglSettings.backgroundBottomHexColor.substr(1), 16);
                $scope.shapeView.SetTopBottomBackgroundColor(topColor, bottomColor);
            }
        }
    }

    $scope.SetSelectionColor = function(select) {
        if ($scope.shapeView) {
            if (select) {
                let fillColor = "0x" + $scope.webglSettings.partselfillHexColor.substr(1);
                let outlineColor = "0x" + $scope.webglSettings.partseloutlineHexColor.substr(1);

                // color
                $scope.shapeView.SetSelectionColor(Module.SelectionList.PRIMARYSELECTION, parseInt(fillColor) , parseInt(outlineColor));
                // style
                if ($scope.selectHighlightStyle == "FILL")
                    $scope.shapeView.SetSelectionHighlightStyle(Module.SelectionList.PRIMARYSELECTION, Module.HighlightStyle.FILL)
                if ($scope.selectHighlightStyle == "OUTLINE") {
                    $scope.shapeView.SetSelectionHighlightStyle(Module.SelectionList.PRIMARYSELECTION, Module.HighlightStyle.OUTLINE)
                    // width
                    $scope.shapeView.SetSelectionHighlightWidth(Module.SelectionList.PRIMARYSELECTION, Number($scope.highlightSelectWidth.id));
                }
            } else { // preselect
                let fillColor = "0x" + $scope.webglSettings.partpreselfillHexColor.substr(1);
                let outlineColor = "0x" + $scope.webglSettings.partpreseloutlineHexColor.substr(1);
                // color
                $scope.shapeView.SetSelectionColor(Module.SelectionList.PRESELECTION, parseInt(fillColor) , parseInt(outlineColor));
                // style
                if ($scope.preSelectHighlightStyle == "FILL")
                    $scope.shapeView.SetSelectionHighlightStyle(Module.SelectionList.PRESELECTION, Module.HighlightStyle.FILL)
                if ($scope.preSelectHighlightStyle == "OUTLINE") {
                    $scope.shapeView.SetSelectionHighlightStyle(Module.SelectionList.PRESELECTION, Module.HighlightStyle.OUTLINE)
                    // width
                    $scope.shapeView.SetSelectionHighlightWidth(Module.SelectionList.PRESELECTION, Number($scope.highlightPreSelectWidth.id));
                }
            }
        }
    }

    $scope.GetBGColorDlgSize = function() {
        if ($scope.backgroundColorNum == 'ONE') {
            return {
                'width':'370px',
                'height':'410px'
            }
        } else if ($scope.backgroundColorNum == 'TWO') {
            return {
                'width':'370px',
                'height':'480px'
            }
        }
    }

    $scope.GetColorDisplayStyle = function(rgbaHex, selector) {
        let tokens;
        if (rgbaHex.length == 9) {
            tokens = /^#(..)(..)(..)(..)$/.exec(rgbaHex);
        } else if (rgbaHex.length == 7) {
            tokens = /^#(..)(..)(..)$/.exec(rgbaHex);
        }


        if (tokens) {
            let rgba = tokens.slice(1).map(function (hex) {
                return parseInt(hex, 16);
            });

            let alpha = rgba.length == 4 ? (rgba[3] / 255).toFixed(2) : 1.0;
            let color = rgbaHex.substr(0, 7);
            let border = $scope.partColorSelector == selector ? '1px solid black' : '1px solid LightGray';

            return {
                'background-color': color,
                'opacity': alpha,
                'border': border
            }
        }
    }

    $scope.GetColorHexTextStyle = function(selector) {
        if (selector == $scope.partColorSelector) {
            return {
                'border':'1px solid black',
                'color':'black',
            }
        } else {
            return {
                'border':'1px solid LightGray',
                'color':'LightGray',
            }
        }
    }

    $scope.GetColorRGBATextStyle = function(selector) {
        if (selector == $scope.partColorSelector) {
            return {'color':'gray'}
        } else {
            return {'color':'LightGray'}
        }
    }

    $scope.GetColorRGBAText = function(rgbaHex) {
        var tokens = /^#(..)(..)(..)(..)$/.exec(rgbaHex);

        if (tokens) {
            let rgba = tokens.slice(1).map(function (hex) {
                return parseInt(hex, 16); // Normalize to 1
            });

            let res = 'R: '  + rgba[0]
                    + ' G: ' + rgba[1]
                    + ' B: ' + rgba[2]
                    + ' A: ' + (rgba[3] / 255).toFixed(2);

            return res;
        }
    }

    $scope.GetColorRGB = function(rgbHex) {
        var tokens = /^#(..)(..)(..)$/.exec(rgbHex);

        if (tokens) {
            let rgb = tokens.slice(1).map(function (hex) {
                return parseInt(hex, 16); // Normalize to 1
            });

            let res = {r:(rgb[0]/255).toFixed(2),
                       g:(rgb[1]/255).toFixed(2),
                       b:(rgb[2]/255).toFixed(2)};

            return res;
        }
    }

    $scope.ShowCustomSelectionColorDialog = function (selector) {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.dialogId = "customSelectionColorDlgBox";
            $scope.dialogTitleId = "customSelectionColorDlgBoxTitle";
            $scope.partColorSelector = selector;
            $scope.showDialog();
        }
    }

    $scope.CustomSelectOkApplayPress = function(hide){
        // TODO: optimization option: change only what has changed
        for (let i = 0; i < 5; i++) {
            let customSelectStr = 'CUSTOMSELECT_' + (i+1).toString();
            let fillColor = "0x" + $scope.customSelectColor[i].fill.substr(1);
            let outlineColor = "0x" + $scope.customSelectColor[i].outline.substr(1);
            $scope.shapeView.SetSelectionFillColor(Module.SelectionList[customSelectStr], parseInt(fillColor));
            $scope.shapeView.SetSelectionOutlineColor(Module.SelectionList[customSelectStr], parseInt(outlineColor));
            // style
            if ($scope.customSelectStyleArray[i] == "FILL")
                $scope.shapeView.SetSelectionHighlightStyle(Module.SelectionList[customSelectStr], Module.HighlightStyle.FILL)
            if ($scope.customSelectStyleArray[i] == "OUTLINE") {
                $scope.shapeView.SetSelectionHighlightStyle(Module.SelectionList[customSelectStr], Module.HighlightStyle.OUTLINE)
                // width
                $scope.shapeView.SetSelectionHighlightWidth(Module.SelectionList[customSelectStr], $scope.customSelectWidths[i]);
            }
        }

        if (hide) {
            $scope.partColorSelector = 0;
            $scope.hideDialog();
        }
    }

    $scope.ApplyCustomSelect = function (customSelectID) {
        for (var i = 0; i < $scope.nodeSelection.length; i++) {
            var node = $scope.idpathMap[$scope.nodeSelection[i]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                    if (customSelectID == 0) {
                        // un-select all
                        $scope.model.DeselectAll(Module.SelectionList.CUSTOMSELECT_1);
                        $scope.model.DeselectAll(Module.SelectionList.CUSTOMSELECT_2);
                        $scope.model.DeselectAll(Module.SelectionList.CUSTOMSELECT_3);
                        $scope.model.DeselectAll(Module.SelectionList.CUSTOMSELECT_4);
                        $scope.model.DeselectAll(Module.SelectionList.CUSTOMSELECT_5);
                    } else if (customSelectID > 0) {
                        let customSelectStr = 'CUSTOMSELECT_' + customSelectID.toString();
                        $scope.model.SelectPart(strippedIdpath, true, Module.SelectionList[customSelectStr]);
                    }
                }
            }
        }
    }

    $scope.CustomSelectCancelPress = function () {
        $scope.partColorSelector = 0;
        $scope.hideDialog();
    }

    $scope.ShowPartSelectionColorDialog = function(selector) {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.dialogId = "partSelectionColorDlgBox";
            $scope.dialogTitleId = "partSelectionColorDlgBoxTitle";
            $scope.partColorSelector = selector;
            $scope.showDialog();
        }
    }

    $scope.ShowPartPreselectionColorDialog = function(selector) {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.dialogId = "partPreselectionColorDlgBox";
            $scope.dialogTitleId = "partPreselectionColorDlgBoxTitle";
            $scope.partColorSelector = selector;
            $scope.showDialog();
        }
    }

    $scope.CustomPartSelectionMode = function(hide) {
        if (hide) {
            $scope.partColorSelector = 0;
            $scope.hideDialog();
        }
        // save the current selection fill/outline color to current select
        let index = $scope.customCurrentSelectMode - 1;
        $scope.customSelectColor[index].fill = $scope.customSelectPickerFillColor;
        $scope.customSelectColor[index].outline = $scope.customSelectPickerOutlineColor;
        $scope.customSelectWidths[index] = Number($scope.customSelectWidth.id);
        $scope.customSelectStyleArray[index] = $scope.customSelectStyle;

        // update new selection fill/outline color according to input select = mode
        index = $scope.customSelectMode - 1;
        $scope.customSelectPickerFillColor = $scope.customSelectColor[index].fill;
        $scope.customSelectPickerOutlineColor = $scope.customSelectColor[index].outline;
        $scope.customSelectWidth.id = $scope.customSelectWidths[index];
        $scope.customSelectStyle = $scope.customSelectStyleArray[index];
        $scope.partColorSelector = 8 + (index * 2);

        // update current select value
        $scope.customCurrentSelectMode = $scope.customSelectMode;

    }

    $scope.CustomSelectStyleChange = function () {
        // save the modify style
        $scope.customSelectStyleArray[$scope.customSelectMode - 1] = $scope.customSelectStyle;
    }

    $scope.CustomSelectWidthChange = function () {
        // save the modify with to the current select mode
        $scope.customSelectWidths[$scope.customSelectMode - 1] = Number($scope.customSelectWidth.id);;
    }

    $scope.PartSelectionColorDlgOK = function(hide) {
        if (hide) {
            $scope.partColorSelector = 0;
            $scope.hideDialog();
        }

        let updated = false;
        if ($scope.webglSettings.partselfillHexColor != $scope.partSelectionFillColor) {
            $scope.webglSettings.partselfillHexColor = $scope.partSelectionFillColor;
            $scope.SaveWebglSettings('partselfillHexColor');
            updated = true;
        }

        if ($scope.webglSettings.partseloutlineHexColor != $scope.partSelectionOutlineColor) {
            $scope.webglSettings.partseloutlineHexColor = $scope.partSelectionOutlineColor;
            $scope.SaveWebglSettings('partseloutlineHexColor');
            updated = true;
        }

        if ($scope.webglSettings.selectHighlightStyle != $scope.selectHighlightStyle) {
            $scope.webglSettings.selectHighlightStyle = $scope.selectHighlightStyle;
            $scope.SaveWebglSettings('selectHighlightStyle');
            updated = true;
        }

        $scope.selectHighlightWidth = Number($scope.highlightSelectWidth.id);
        if ($scope.webglSettings.selectHighlightWidth != $scope.selectHighlightWidth) {
            $scope.webglSettings.selectHighlightWidth = $scope.selectHighlightWidth;
            $scope.SaveWebglSettings('selectHighlightWidth');
            updated = true;
        }

        if (updated)
            $scope.SetSelectionColor(true);
    }

    $scope.PartSelectionColorDlgCancel = function() {
        $scope.partColorSelector = 0;
        $scope.hideDialog();

        $scope.partSelectionFillColor = $scope.webglSettings.partselfillHexColor;
        $scope.partSelectionOutlineColor = $scope.webglSettings.partseloutlineHexColor;
    }

    $scope.PartPreselectionColorDlgOK = function(hide) {
        if (hide) {
            $scope.partColorSelector = 0;
            $scope.hideDialog();
        }

        let updated = false;
        if ($scope.webglSettings.partpreselfillHexColor != $scope.partPreselectionFillColor) {
            $scope.webglSettings.partpreselfillHexColor = $scope.partPreselectionFillColor;
            $scope.SaveWebglSettings('partpreselfillHexColor');
            updated = true;
        }

        if ($scope.webglSettings.partpreseloutlineHexColor != $scope.partPreselectionOutlineColor) {
            $scope.webglSettings.partpreseloutlineHexColor = $scope.partPreselectionOutlineColor;
            $scope.SaveWebglSettings('partpreseloutlineHexColor');
            updated = true;
        }
        if ($scope.webglSettings.preSelectHighlightStyle != $scope.preSelectHighlightStyle) {
            $scope.webglSettings.preSelectHighlightStyle = $scope.preSelectHighlightStyle;
            $scope.SaveWebglSettings('preSelectHighlightStyle');
            updated = true;
        }

        $scope.preSelectHighlightWidth = Number($scope.highlightPreSelectWidth.id);
        if ($scope.webglSettings.preSelectHighlightWidth != $scope.preSelectHighlightWidth) {
            $scope.webglSettings.preSelectHighlightWidth = $scope.preSelectHighlightWidth;
            $scope.SaveWebglSettings('preSelectHighlightWidth');
            updated = true;
        }
        if (updated)
            $scope.SetSelectionColor(false);
    }

    $scope.PartPreselectionColorDlgCancel = function() {
        $scope.partColorSelector = 0;
        $scope.hideDialog();

        $scope.partPreselectionFillColor = $scope.webglSettings.partpreselfillHexColor;
        $scope.partPreselectionOutlineColor = $scope.webglSettings.partpreseloutlineHexColor;
    }

    $scope.ShowBackgroundColorDialog = function(selector) {
        if ($scope.dialogId == "" && $scope.dialogTitleId == "") {
            $scope.dialogId = "backgroundColorDlgBox";
            $scope.dialogTitleId = "backgroundColorDlgBoxTitle";
            $scope.partColorSelector = selector;
            $scope.showDialog();
        }
    }

    $scope.BackgroundColorDlgOK = function(hide) {
        if (hide) {
            $scope.partColorSelector = 0;
            $scope.hideDialog();
        }

        if ($scope.backgroundColorNum == 'ONE') {
            $scope.webglSettings.backgroundColorNum = 'ONE';

            $scope.webglSettings.backgroundHexColor = $scope.backgroundColor;
            $scope.SaveWebglSettings('backgroundHexColor');
        } else if ($scope.backgroundColorNum == 'TWO') {
            $scope.webglSettings.backgroundColorNum = 'TWO';

            $scope.webglSettings.backgroundTopHexColor = $scope.backgroundTopColor;
            $scope.SaveWebglSettings('backgroundTopHexColor');

            $scope.webglSettings.backgroundBottomHexColor = $scope.backgroundBottomColor;
            $scope.SaveWebglSettings('backgroundBottomHexColor');
        }

        $scope.SetBackgroundColor();
    }

    $scope.BackgroundColorDlgCancel = function() {
        $scope.partColorSelector = 0;
        $scope.hideDialog();

        $scope.backgroundColor       = $scope.webglSettings.backgroundHexColor;
        $scope.backgroundTopColor    = $scope.webglSettings.backgroundTopHexColor;
        $scope.backgroundBottomColor = $scope.webglSettings.backgroundBottomHexColor;
        $scope.backgroundColorNum    = $scope.webglSettings.backgroundColorNum;
    }

    $scope.SetVisibility = function(vis, allNode) {
        if (allNode) {
            var rootNode = $scope.uidMap[0];
            if (rootNode) {
                for (var i=0; i<rootNode.children.length; i++) {
                    var child = $scope.uidMap[rootNode.children[i]];
                    if (child) {
                        $scope.SetCurrentModel(child.data.modelId);
                        if ($scope.model) {
                            var strippedIdpath = $scope.StripModelIdFromIdPath(child.data.idpath);
                            $scope.model.SetPartVisibility(strippedIdpath, vis,
                                                           Module.ChildBehaviour.INCLUDE,
                                                           Module.InheritBehaviour.USE_DEFAULT);
                        }
                    }
                }
            }
        } else {
            for (var i=0; i<$scope.nodeSelection.length; i++) {
                var node = $scope.idpathMap[$scope.nodeSelection[i]];
                if (node) {
                    $scope.SetCurrentModel(node.data.modelId);
                    if ($scope.model) {
                        var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                        $scope.model.SetPartVisibility(strippedIdpath, vis,
                                                       Module.ChildBehaviour.INCLUDE,
                                                       Module.InheritBehaviour.USE_DEFAULT);
                    }
                }
            }
        }
    }

    $scope.SetRenderMode = function(cmd) {
        for (var i=0; i<$scope.nodeSelection.length; i++) {
            var node = $scope.idpathMap[$scope.nodeSelection[i]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                    if (cmd == "Phantom")
                        $scope.model.SetPartRenderMode(strippedIdpath,
                                                       Module.PartRenderMode.PHANTOM,
                                                       Module.ChildBehaviour.INCLUDE,
                                                       Module.InheritBehaviour.USE_DEFAULT);
                    else if (cmd == "Shaded")
                        $scope.model.SetPartRenderMode(strippedIdpath,
                                                       Module.PartRenderMode.SHADED,
                                                       Module.ChildBehaviour.INCLUDE,
                                                       Module.InheritBehaviour.USE_DEFAULT);
                }
            }
        }
    }

    $scope.UnsetRenderMode = function() {
        for (var i=0; i<$scope.nodeSelection.length; i++) {
            var node = $scope.idpathMap[$scope.nodeSelection[i]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                    $scope.model.UnsetPartRenderMode(strippedIdpath, Module.ChildBehaviour.INCLUDE);
                }
            }
        }
    }

    $scope.SetShadowCast = function(shadowCast) {
        for (var i=0; i<$scope.nodeSelection.length; i++) {
            var node = $scope.idpathMap[$scope.nodeSelection[i]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                    $scope.model.SetPartShadowCast(strippedIdpath, shadowCast);
                }
            }
        }
    }

    $scope.UnsetShadowCast = function() {
        for (var i=0; i<$scope.nodeSelection.length; i++) {
            var node = $scope.idpathMap[$scope.nodeSelection[i]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                    $scope.model.UnsetPartShadowCast(strippedIdpath);
                }
            }
        }
    }

    $scope.SetOpacity = function(t) {
        for (var i=0; i<$scope.nodeSelection.length; i++) {
            var node = $scope.idpathMap[$scope.nodeSelection[i]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                    $scope.model.SetPartOpacity(strippedIdpath, t,
                                                Module.ChildBehaviour.INCLUDE,
                                                Module.InheritBehaviour.USE_DEFAULT);
                }
            }
        }
    }

    $scope.UnsetOpacity  = function() {
        for (var i=0; i<$scope.nodeSelection.length; i++) {
            var node = $scope.idpathMap[$scope.nodeSelection[i]];
            if (node) {
                $scope.SetCurrentModel(node.data.modelId);
                if ($scope.model) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                    $scope.model.UnsetPartOpacity(strippedIdpath, Module.ChildBehaviour.INCLUDE);
                }
            }
        }
    }

    $scope.Isolate = function() {
        $scope.SetVisibility(false, true);
        $scope.SetVisibility(true, false);
    }

    $scope.ShowContextMenu = function(show, type) {
        /*$scope.SafeApply(function () {
            if (show == true) {
                $scope.contextMenuType = type;
                document.getElementById('context-menu').style.display = "block";
            } else {
                document.getElementById('context-menu').style.display = "none";
            }
        });*/
    }

    $scope.GetContextMenuType = function() {
         return $scope.contextMenuType;
    }

    $scope.SelectRibbonMenu = function(delta) {
        let menus = [];
        menus.push('home');
        menus.push('markup');
        menus.push('viewlocation');
        let plVis = document.getElementById("partLocationMenu").offsetParent !== null;
        if (plVis) menus.push('partlocation');
        let mlElm = document.getElementById("modelLocationMenu").offsetParent !== null;
        if (mlElm) menus.push('modellocation');
        let docElm = document.getElementById("documentMenu").offsetParent !== null;
        if (docElm) menus.push('docinfo');
        let curMenu = menus.indexOf($scope.activeMenu);
        if (delta > 0) {
            curMenu = curMenu + 1;
            if (curMenu == menus.length)
                curMenu = menus.length - 1;
        } else if (delta < 0) {
            curMenu = curMenu - 1;
            if (curMenu < 0)
                curMenu = 0;
        } else {
            return;
        }

        $scope.SafeApply(function() {
            $scope.activeMenu = menus[curMenu];
        });
    }

    $scope.UpdateSelectionList = function() {
        if ($scope.selection.length > 0) {
            $scope.instanceSelector = $scope.selection[0];
        } else {
            $scope.instanceSelector = "";

            $scope.DelayedApply(50, function() {
                if ($scope.activeMenu == 'partlocation' &&
                    $scope.selection.length != 1) {
                    $scope.activeMenu = 'home';
                }
            });
        }

        $scope.GetPartLocation();
        $scope.GetInstanceName();
        $scope.GetInstanceProperties();

    }

    $scope.UpdateTreeSelection = function() {
        if ($scope.webglSettings.expandAncestors == 'YES') {
            if ($scope.nodeSelection.length > 0) {
                $rootScope.$emit('UpdateTreeSelection', {class:'structureTree'});
            }
        }
    }

    $scope.SetSpinCenter = function () {
        $scope.shapeView.SetSpinCenter();
    }

    $scope.SetAutomaticSpinCenter = function() {
        if ($scope.autoSpinCenter == true) {
            $scope.autoSpinCenter = false;
        } else {
            $scope.autoSpinCenter = true;
        }

        $scope.shapeView.SetAutoSpinCenter($scope.autoSpinCenter);
    }

    $scope.GetAutoSpinCenterButtonStyle = function() {
        var pressed = {'background-color':'#DFE1E2','border-style':'inset'};
        var released = {'background-color':'#ffffff','border-style':'outset'};

        if ($scope.autoSpinCenter == true)
            return pressed;
        else
            return released;
    }

    $scope.RemoveAllModels = function() {
        $scope.ModelsMenuVisible = false;
        $scope.selection = [];
        if (!$scope.view3D && ThingView) {
            ThingView.Destroy2DCanvas();
            $scope.view3D = true;
            $scope.viewExtension = '';
            ThingView.Show3DCanvas($scope.session);
        }

        $scope.model = null;
        $scope.session.RemoveAllLoadSources();
        var keys = Object.keys($scope.models);
        for (var i=keys.length-1; i>-1; i--) {
            var model = $scope.models[keys[i]];
            if (model) {
                $scope.models[keys[i]].delete();
                model = null;
            }
        }

        $scope.viewStates = [];
        $scope.viewOrients = [];
        $scope.orientations = $scope.orientPresets.concat($scope.viewOrients);
        $scope.illustrations = [];
        $scope.loadedIllustration = "-";
        $scope.viewablesData = [];
        $scope.documentSelector = "";
        $scope.annotationSets = [];
        $scope.annotationSetSelector = "";
        $scope.layers = [];
        $scope.selectedLayer = undefined;
        $scope.layerTarget = undefined;
        $scope.layerTargetText = "";
        $scope.modelParams = { "url":"", "baseUrl":"", "templateUrl":"", "mapUrl":"", "getmarkupUrl":""}
        $scope.loadState = "";
        $scope.loadTime = 0;
        $scope.startTime = 0;
        $scope.currentDocument = null;
        $scope.spatialFilterResult.filteredItemsNum = 0;
        $scope.spatialFilterResult.filteredItems = [];
        $scope.spatialFilterResult.query = {};
        $scope.sectioning = false;
        $scope.sectioningUserCreated = false;
        $scope.sectioningPlanar = true;

        $scope.ResetSequenceStepInfo();

        $scope.shapeScene.ShowFloor(false, 0x505050E0, 0xE0E0E0E0);
        $scope.shapeScene.RemoveAllCVMarkups(Module.CV_MARKUP_TYPES.CVMARKUPTYPE_ALL);
        $scope.shapeScene.RemoveSectionCut();
        $scope.RemoveAllBoundingMarker();
        $scope.RemoveLeaderlines();

        $rootScope.$emit('ClearTree', {class:'structureTree'});
        $rootScope.$emit('ClearTree', {class:'modelannotationsTree'});

        $scope.DelayedApply(50, function() {
            $scope.activeMenu = "home";
            //$scope.selection = [];
        });
    }

    $scope.GetLoadTime = function() {
        var elapsedTime = ((performance.now() - $scope.startTime) / 1000).toFixed(3);
        return (elapsedTime);
    }

    $scope.OpenModel = function(input) {
        if (input.files[0]) {
            var file = input.files[0];
            var reader = new FileReader();
            reader.filename = file.name;
            reader.onload = function () {
                var arrayBuffer = reader.result;
                angular.element(document.getElementById('app')).scope().LoadModel(reader.filename, arrayBuffer);
                storeDataSet(file.name, arrayBuffer);
            }
            reader.readAsArrayBuffer(file);
        }
    }

    $scope.LoadParts = function () {
        if ($scope.model) {
            if ($scope.nodeSelection.length) {
                var idPathArr = new Module.VectorString();
                for (var i=0; i<$scope.nodeSelection.length ; i++) {
                    var strippedIdpath = $scope.StripModelIdFromIdPath($scope.nodeSelection[i]);
                    idPathArr.push_back(strippedIdpath);
                }

                $scope.model.LoadParts(idPathArr, true, function(result) {
                    if (result == true) {
                        console.log('LoadParts successfully completed.');
                    }
                });
            }
        }
    }

    $scope.SetInertialSpinDecayRate = function() {
        if ($scope.shapeView) {
            $scope.shapeView.SetInertialSpinDecayRate($scope.webglSettings.decayrate);
        }
    }

    $scope.ToggleViewablesModel = function() {
        $scope.viewablesModelDisplay = !$scope.viewablesModelDisplay;
    }

    $scope.ToggleViewablesFigures = function() {
        $scope.viewablesFiguresDisplay = !$scope.viewablesFiguresDisplay;
    }

    $scope.ToggleViewablesDocuments = function() {
        $scope.viewablesDocumentsDisplay = !$scope.viewablesDocumentsDisplay;
    }

    $scope.Create3DSession = function () {
        if ($scope.session) {
            $scope.RemoveAllModels();
            $scope.MyModelClass = null;
            $scope.progress = 0;
            $scope.timer = null;
            $scope.webglSettings.autoload = 'YES';
            ThingView.DeleteSession($scope.session);
            ThingView._completeInit();
            $scope.app = ThingView.CreateCVApplication($scope.sessionId);
            $scope.session = $scope.app.GetSession();
            $scope.SetBackgroundColor();
            $scope.UpdateSelectionFilter();
            if ($scope.webglSettings.dragMode == 'YES')
                $scope.shapeView.SetDragMode(Module.DragMode.DRAG);
            else
                $scope.shapeView.SetDragMode(Module.DragMode.NONE);
            $scope.shapeView.SetDragSnap($scope.webglSettings.dragSnap == 'YES');
            $scope.SetNavigationMode($scope.webglSettings.navMode);
            $scope.shapeView.ShowSpinCenter($scope.webglSettings.showSpinCenter == 'YES');
            if ($scope.webglSettings.antiAliasing == "YES")
                $scope.shapeView.SetAntialiasingMode(Module.AntialiasingMode.SS4X);
            else
                $scope.shapeView.SetAntialiasingMode(Module.AntialiasingMode.NONE);
            $scope.session.EnableCrossSiteAccess($scope.webglSettings.enableCrossSiteAccess == 'YES');
            $scope.shapeScene.SetShapeFilters($scope.webglSettings.shapeFilters); // Turn on misc & planar annotations
            $scope.SetSelectionColor(true);
            $scope.SetSelectionColor(false);
            $scope.SetInertialSpinDecayRate();
        }
    }

    $scope.RegisterTreeObserver = function() {
        if ($scope.treeObserver == null) {
            $scope.treeObserver = new $scope.MyTreeClass();
            $scope.session.RegisterTreeObserver($scope.treeObserver);
        }
    }

    $scope.RegisterSelectionObserver = function() {
        if ($scope.selectionObserver == null) {
            $scope.selectionObserver = new $scope.MySelectionClass();
            $scope.shapeScene.RegisterSelectionObserver($scope.selectionObserver);
        }
    }

    $scope.ParseTreeAddMessage = function(messageArr) {
        $rootScope.$emit('ParseTreeAddMessage', {class:'structureTree', message:messageArr});
    }

    $scope.ParseTreeRemoveMessage = function(messageArr) {
        $rootScope.$emit('ParseTreeRemoveMessage', {class:'structureTree', message:messageArr});
    }

    $scope.ParseTreeUpdateMessage = function(messageArr) {
        $rootScope.$emit('ParseTreeUpdateMessage', {class:'structureTree', message:messageArr});
    }

    $scope.ApplyNodeSelectionList = function() {
        $rootScope.$emit('ApplyNodeSelectionList', {class:'structureTree'});
    }

    $scope.ExpandChildren = function(expand) {
        $rootScope.$emit('ExpandChildren', {class:'structureTree', message:expand});
    }

    $scope.StripModelIdFromIdPath = function(idpath) {
        var out = idpath;
        if (out[0] == ':') {
            if (out.length == 1) {
                // Root
                return out;
            } else {
                var n = out.indexOf('/');
                if (n == -1) {
                    // Model Root
                    return '/';
                } else {
                    out = out.substr(n);
                }
            }
        }

        return out;
    }

    $scope.ClearNodeSelection = function() {
        if ($scope.session) {
            $scope.nodeSelection = [];
            $scope.DeselectAll(Module.SelectionList.PRIMARYSELECTION);
            $scope.DeselectAll(Module.SelectionList.PRESELECTION);
            $scope.ShowContextMenu(false);
            $rootScope.$emit('ClearTree', {class:'modelannotationsTree'});

            $scope.DelayedApply(50, function() {
                if ($scope.activeMenu == 'partlocation' &&
                    $scope.selection.length != 1) {
                    $scope.activeMenu = 'home';
                }
            });
        }
    }

    $scope.ClearFeatureSelection = function() {
        $rootScope.$emit('ClearFeatureSelection', {class:'modelannotationsTree'});
    }

    $scope.SetCurrentModel = function(id) {
        var name = "Model" + id;
        $scope.model = $scope.models[name];
    }

    $scope.ToggleTableSelection = function(divId){
        var backgroundColor = "rgb(102, 153, 255)";
        var textColor = "rgb(255, 255, 255)";
        var toggleDiv = document.getElementById("itemList_" + divId);
        if(toggleDiv.getAttribute('style') && toggleDiv.getAttribute('style').indexOf("background-color: " + backgroundColor) != -1){
            toggleDiv.setAttribute('style',"");
        } else {
            toggleDiv.setAttribute('style',"background-color: " + backgroundColor + "; color: " + textColor);
        }
    }

    $scope.itemListMarkCallout = function(calloutId, groupIdx) {
        var itemsList =  $scope.model.GetItemsList();
        if (itemsList) {
            for (var i=0;i<$scope.itemslist.length;++i) {
                if($scope.itemslist[i]["calloutId"]==calloutId){
                    var itemIndex = itemsList.GetItemIndexFromCalloutId($scope.itemslist[i].calloutId);
                    var intsVec = new Module.VectorNumber();
                    intsVec.push_back(itemIndex);
                }
            }
            if (groupIdx < 5)
                itemsList.MarkCallout(intsVec, Number(groupIdx), true);
            else
                itemsList.UnMarkCallout(intsVec, true);
        }
    }

    $scope.itemListSelection = function(calloutId, divId) {
        if($scope.view3D){
            var itemsList =  $scope.model.GetItemsList();
            if (itemsList) {
                var intsVec = new Module.VectorNumber();
                for (var i=0;i<$scope.itemslist.length;++i) {
                    if($scope.itemslist[i]["calloutId"]==calloutId){
                        $scope.itemslist[i]["selected"] = !$scope.itemslist[i]["selected"];
                    }
                    if ($scope.itemslist[i]["selected"]) {
                        var itemIndex = itemsList.GetItemIndexFromCalloutId($scope.itemslist[i].calloutId);
                        intsVec.push_back(itemIndex);
                    } else {
                    }
                }
                itemsList.SelectItemCallouts(intsVec, true);
            }
        } else if($scope.viewType == Module.ViewableType.ILLUSTRATION && $scope.viewExtension == "svg"){
            var itemsList = ThingView.GetCallouts();
            if (itemsList.length > 0){
                for (var i = 0; i<$scope.itemslist.length; i++){
                    if($scope.itemslist[i]["calloutId"]==calloutId){
                        $scope.itemslist[i]["selected"] = !$scope.itemslist[i]["selected"];
                    }
                    if($scope.itemslist[i]["selected"]){
                        var calloutID = $scope.itemslist[i]["calloutId"];
                        var callout;
                        for (var j = 0; j < itemsList.length; j++){
                            if (itemsList[j].getAttribute("id")==calloutID){
                                callout = itemsList[j];
                            }
                        }
                        if(callout){
                            ThingView.SelectCallout(callout);
                        }
                    } else {
                        var calloutID = $scope.itemslist[i]["calloutId"];
                        var callout;
                        for (var j = 0; j < itemsList.length; j++){
                            if (itemsList[j].getAttribute("id")==calloutID){
                                callout = itemsList[j];
                            }
                        }
                        if(callout){
                            ThingView.DeselectCallout(callout);
                        }
                    }
                }
            }
        }
        $scope.ToggleTableSelection(divId);
    }

    $scope.GetItemsListName = function(label, nameTag) {
        if ($scope.showItemslistHierarchy == 'NO') {
            return decode_utf8(nameTag);
        }

        var depth = label.split('.').length - 1;
        if (depth) {
            var res = '';
            for (var i=0;i<depth;i++) {
                res += '\xa0\xa0\xa0';
            }
            res += decode_utf8(nameTag);
            return res;
        } else {
            return decode_utf8(nameTag);
        }
    }

    $scope.GetLeaderLineButtonStyle = function() {
        var pressed = {'background-color':'#DFE1E2','border-style':'inset'};
        var released = {'background-color':'#ffffff','border-style':'outset'};

        if ($scope.creatingLeaderLine)
            return pressed;
        else
            return released;
    }

    function handleLeaderlineMouseDown(evt) {
        if (evt.button == 0) { // Left button
            $scope.leaderlineMouseDownX = evt.offsetX;
            $scope.leaderlineMouseDownY = evt.offsetY;
            $scope.leaderlineMouseDownTime = Date.now();
        }
    }

    function handleLeaderlineMouseClick(evt) {
        if (evt.button == 0) {
            $scope.PickLeaderLinePoint(evt.offsetX, evt.offsetY, evt.target.width, evt.target.height);
        }
    }

    function handleLeaderlineTouchStart(evt) {
        if (evt.touches.length == 1) {
            let x = evt.touches[0].pageX ? evt.touches[0].pageX : evt.touches[0].clientX;
            let y = evt.touches[0].pageY ? evt.touches[0].pageY : evt.touches[0].clientY;
            $scope.leaderlineMouseDownX = x - evt.target.offsetLeft;
            $scope.leaderlineMouseDownY = y - evt.target.offsetTop;
            $scope.leaderlineMouseDownTime = Date.now();
            $scope.leaderlineTouchValid = true;
        }
    }

    function handleLeaderlineTouchMove(evt) {
        if (evt.touches.length == 1) {
            let x = evt.touches[0].pageX ? evt.touches[0].pageX : evt.touches[0].clientX;
            let y = evt.touches[0].pageY ? evt.touches[0].pageY : evt.touches[0].clientY;
            x = x - evt.target.offsetLeft;
            y = y - evt.target.offsetTop;

            if (Math.abs(x - $scope.leaderlineMouseDownX) > $scope.leaderlineJitterLimit ||
                Math.abs(y - $scope.leaderlineMouseDownY) > $scope.leaderlineJitterLimit) {
                $scope.leaderlineTouchValid = false;
            }
        }
    }

    function handleLeaderlineTouchEnd(evt) {
        if ($scope.leaderlineTouchValid) {
            $scope.PickLeaderLinePoint($scope.leaderlineMouseDownX, $scope.leaderlineMouseDownY,
                                       evt.target.width, evt.target.height);
        }
    }

    $scope.PickLeaderLinePoint = function(posx, posy, width, height) {
        let now = Date.now();
        if (Math.abs(posx - $scope.leaderlineMouseDownX) > $scope.leaderlineJitterLimit ||
            Math.abs(posy - $scope.leaderlineMouseDownY) > $scope.leaderlineJitterLimit ||
            now - $scope.leaderlineMouseDownTime > $scope.leaderlineTimeLimit) {
            return;
        }

        $scope.shapeView.DoPickWithCallback(posx, posy, true, false, function(result) {
            if (result.IsValid()) {
                let position = result.GetLocation().position;
                $scope.currentLeaderLine.AddWorldPoint(position.x, position.y, position.z);
            } else {
                // Get bounding box
                let bbox = $scope.leaderlineBbox;
                if (bbox.valid) {
                    function getDistance(p1, p2) {
                        let x = (p1.x - p2.x) * (p1.x - p2.x),
                            y = (p1.y - p2.y) * (p1.y - p2.y),
                            z = (p1.z - p2.z) * (p1.z - p2.z);
                        let res = x + y + z;
                        return res;
                    }

                    function getMidPoint(p1, p2) {
                        return {x:(p1.x + p2.x) / 2,y:(p1.y + p2.y) / 2,z:(p1.z + p2.z) / 2};
                    }

                    let pts = new Array(8);
                    pts[0] = {x:bbox.min.x,y:bbox.min.y,z:bbox.min.z};
                    pts[1] = {x:bbox.max.x,y:bbox.max.y,z:bbox.max.z};
                    let viewLoc = $scope.shapeView.GetViewLocation();
                    let viewPos = {};
                    if ($scope.shapeView.IsPerspective()) {
                        viewPos = viewLoc.position;
                    } else {
                        let DtoR = Math.PI / 180;
                        let sx = Math.sin(viewLoc.orientation.x * DtoR),
                            cx = Math.cos(viewLoc.orientation.x * DtoR),
                            sy = Math.sin(viewLoc.orientation.y * DtoR),
                            cy = Math.cos(viewLoc.orientation.y * DtoR),
                            sz = Math.sin(viewLoc.orientation.z * DtoR),
                            cz = Math.cos(viewLoc.orientation.z * DtoR);
                        let viewNormal = {x:cx*cz*sy+sx*sz,y:-cz*sx+cx*sy*sz,z:cx*cy};
                        let boxDiagonal = getDistance(pts[0], pts[1]) * 10;
                        viewPos = {x:viewNormal.x*boxDiagonal,y:viewNormal.y*boxDiagonal,z:viewNormal.z*boxDiagonal};
                    }

                    let bboxCenter = getMidPoint(pts[0], pts[1]);

                    pts[2] = {x:pts[1].x,y:pts[0].y,z:pts[0].z};
                    pts[3] = {x:pts[0].x,y:pts[1].y,z:pts[0].z};
                    pts[4] = {x:pts[0].x,y:pts[0].y,z:pts[1].z};

                    pts[5] = {x:pts[0].x,y:pts[1].y,z:pts[1].z};
                    pts[6] = {x:pts[1].x,y:pts[0].y,z:pts[1].z};
                    pts[7] = {x:pts[1].x,y:pts[1].y,z:pts[0].z};

                    let minId = -1,
                        minDist = 0;
                    for (let i=0;i<8;i++) {
                        let dist = getDistance(viewPos, pts[i]);
                        if (i == 0 || dist < minDist) {
                            minDist = dist;
                            minId = i;
                        }
                    }
                    let midPt = getMidPoint(pts[minId], bboxCenter);

                    let plane = new Object();
                    plane.position = midPt;
                    plane.orientation = viewLoc.orientation;
                    plane.scale = {x:1.0,y:1.0,z:1.0};
                    plane.size  = {x:1.0,y:1.0,z:1.0};
                    plane.valid = true;

                    let spacePt = $scope.shapeView.DoPickPlane(posx, posy, true, plane);
                    if (spacePt.valid) {
                        let position = spacePt.position;
                        $scope.currentLeaderLine.AddWorldPoint(position.x, position.y, position.z);
                    }
                } else {
                    let x = posx - width / 2,
                        y = height / 2 - posy;
                    $scope.currentLeaderLine.AddScreenPixelPoint(x, y);
                }
            }
        });
    }

    $scope.RemoveCurrentLeaderLine = function() {
        if ($scope.currentLeaderLine) {
            $scope.shapeScene.DeleteLeaderlineMarker($scope.currentLeaderLine);
            delete $scope.currentLeaderLine;
        }
    }

    $scope.AddLeaderLineListener = function() {
        var elm = document.getElementById("parentVizDiv");
        if (elm != undefined) {
            elm.addEventListener("mousedown", handleLeaderlineMouseDown, false);
            elm.addEventListener("click", handleLeaderlineMouseClick, false);

            elm.addEventListener("touchstart", handleLeaderlineTouchStart, false);
            elm.addEventListener("touchmove", handleLeaderlineTouchMove, false);
            elm.addEventListener("touchend", handleLeaderlineTouchEnd, false);
        }
    }

    $scope.RemoveLeaderLineListener = function() {
        var elm = document.getElementById("parentVizDiv");
        if (elm != undefined) {
            elm.removeEventListener("mousedown", handleLeaderlineMouseDown, false);
            elm.removeEventListener("click", handleLeaderlineMouseClick, false);

            elm.removeEventListener("touchstart", handleLeaderlineTouchStart, false);
            elm.removeEventListener("touchmove", handleLeaderlineTouchMove, false);
            elm.removeEventListener("touchend", handleLeaderlineTouchEnd, false);
        }
    }

    $scope.SaveLeaderLine = function() {
        $scope.ApplyLeaderLineProperties();
        $scope.currentLeaderLine.type = "Leaderline";
        $scope.currentLeaderLine.id = $scope.nextLeaderlineId++;
        $scope.currentLeaderLine.SetSelectable(true);
        $scope.leaderlines.push($scope.currentLeaderLine);
        $scope.HideLeaderLinePropertiesDialog(true);
    }

    $scope.ApplyLeaderLineProperties = function() {
        let lineColor = $scope.GetColorRGB($scope.currentLeaderLineColor);
        $scope.currentLeaderLine.SetColor(Number(lineColor.r), Number(lineColor.g), Number(lineColor.b));
        $scope.currentLeaderLine.SetWidth(Number($scope.leaderLineWidth.id), Module.UNIT_POINT);

        switch ($scope.leaderLineHead.id) {
            default:
            case 1: $scope.currentLeaderLine.SetHeadCap(Module.EndCap.ENDCAP_NONE);   break;
            case 2: $scope.currentLeaderLine.SetHeadCap(Module.EndCap.ENDCAP_ARROW);  break;
            case 3: $scope.currentLeaderLine.SetHeadCap(Module.EndCap.ENDCAP_SPHERE); break;
        }

        switch ($scope.leaderLineTail.id) {
            default:
            case 1: $scope.currentLeaderLine.SetTailCap(Module.EndCap.ENDCAP_NONE);   break;
            case 2: $scope.currentLeaderLine.SetTailCap(Module.EndCap.ENDCAP_ARROW);  break;
            case 3: $scope.currentLeaderLine.SetTailCap(Module.EndCap.ENDCAP_SPHERE); break;
        }

        switch ($scope.leaderLineStyle.id) {
            default:
            case 1:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_SOLID);        break;
            case 2:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_HIDDENLINE);   break;
            case 3:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_LONGDASHDOT);  break;
            case 4:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_CENTERLINE);   break;
            case 5:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_FOURDOTBREAK); break;
            case 6:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_DASHED);       break;
            case 7:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_DASHDASHDASH); break;
            case 8:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_DOTTED);       break;
            case 9:  $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_DOTDOTDOT);    break;
            case 10: $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_DASHDOTDASH);  break;
            case 11: $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_DOTDASH);      break;
            case 12: $scope.currentLeaderLine.SetStipplePattern(Module.StipplePattern.STIPPLEPATTERN_DOTDOTDASH);   break;
        }
    }

    $scope.CreateLeaderLine = function() {
        if ($scope.MyBoundClass == undefined) {
            $scope.ExtendClassInterface();
        }

        if ($scope.dialogId != "" || $scope.dialogTitleId != "") {
            return;
        }

        if ($scope.creatingLeaderLine) {
            $scope.HideLeaderLinePropertiesDialog(false);
            return;
        }

        $scope.leaderlineBbox = $scope.shapeScene.GetWorldBoundingBox();
        $scope.partColorSelector = 99;
        $scope.ShowLeaderLinePropertiesDialog();
        $scope.DisableBoundMarkerSelection();

        $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.DISABLED, Module.SelectionList.PRIMARYSELECTION);
        $scope.shapeScene.SetSelectionFilter(Module.SelectionFilter.DISABLED, Module.SelectionList.PRESELECTION);

        $scope.shapeView.SetDragMode(Module.DragMode.NONE);
        $scope.creatingLeaderLine = true;
        $scope.AddLeaderLineListener();

        $scope.currentLeaderLine = $scope.shapeScene.MakeLeaderlineMarker();

        $scope.ApplyLeaderLineProperties();
    }

    $scope.GetTransformButtonStyle = function() {
        var pressed = {'background-color':'#DFE1E2','border-style':'inset'};
        var released = {'background-color':'#ffffff','border-style':'outset'};

        if ($scope.webglSettings.dragMode == "YES")
            return pressed;
        else
            return released;
    }

    $scope.ToggleTransformMode = function() {
        if ($scope.webglSettings.dragMode == 'YES') {
            $scope.webglSettings.dragMode = 'NO';
        } else {
            $scope.webglSettings.dragMode = 'YES';
        }
    }

    $scope.GetPaneButtonStyle = function(pane) {
        var pressed = {'background-color':'#DFE1E2','border-style':'inset'};
        var released = {'background-color':'#ffffff','border-style':'outset'};

        if (pane === 'primary') {
            if ($scope.showPrimaryPane == 'YES') {
                return pressed;
            } else {
                return released;
            }
        } else if (pane === 'secondary') {
            if ($scope.showSecondaryPane == 'YES') {
                return pressed;
            } else {
                return released;
            }
        } else if (pane === 'bottom') {
            if ($scope.showBottomPane == 'YES') {
                return pressed;
            } else {
                return released;
            }
        } else if (pane === 'onlyGraphics') {
            if ($scope.showOnlyGraphics == 'YES') {
                return pressed;
            } else {
                return released;
            }
        }
    }

    $scope.ShowPane = function(pane) {
        if (pane === 'primary') {
            if ($scope.showPrimaryPane == 'YES') {
                $scope.showPrimaryPane = 'NO';
            } else {
                $scope.showPrimaryPane = 'YES';
            }
        } else if (pane === 'secondary') {
            if ($scope.showSecondaryPane == 'YES') {
                $scope.showSecondaryPane = 'NO';
            } else {
                $scope.showSecondaryPane = 'YES';
            }
        } else if (pane === 'bottom') {
            if ($scope.showBottomPane == 'YES') {
                $scope.showBottomPane = 'NO';
            } else {
                $scope.showBottomPane = 'YES';
                $scope.EnableConsoleLog();
            }
        } else if (pane === 'onlyGraphics') {
            if ($scope.showOnlyGraphics == 'YES') {
                $scope.showOnlyGraphics = 'NO';
            } else {
                $scope.showOnlyGraphics = 'YES';
            }
        }
        $scope.DelayedApply(50, function() {
            resizeBody();
        });
    }

    $scope.UpdateDisplayByClass = function(className, display) {
        var elements = document.getElementsByClassName(className);
        for (var i=0;i<elements.length;i++) {
            elements[i].style.display = display;
        }
    }

    $scope.menuEnterPos = {};
    $scope.ShowModelsMenu = function(event, click) {
        if (click) {
            if ($scope.ModelsMenuVisible) {
                let pos = getPosition(event);
                if ($scope.menuEnterPos.x != pos.x || $scope.menuEnterPos.y != pos.y) {
                    $scope.ModelsMenuVisible = false;
                }
            } else {
                $scope.ModelsMenuVisible = true;
            }
        } else {
            $scope.menuEnterPos = getPosition(event);
            $scope.ModelsMenuVisible = true;
        }

        $scope.SettingsMenuVisible = false;

        if (event) {
            event.stopPropagation();
        }

        $scope.DelayedApply(10, function() {
            if ($scope.ModelsMenuVisible)
                $scope.AdjustModelsMenuWidth();
            resizeBody();
        });
    }

    $scope.HideModelsMenu = function(event, parent) {
        var elem;
        var pos = getPosition(event);
        if ($scope.menuEnterPos.x == pos.x && $scope.menuEnterPos.y == pos.y) {
            return;
        }

        if (parent) {
            elem = document.getElementById("modelsMenuChildren");
        } else {
            elem = document.getElementById("modelsMenuParent");
        }

        $scope.HideMenus(elem, pos);
    }

    $scope.ShowSettingsMenu = function(event, click) {
        if (click) {
            if ($scope.SettingsMenuVisible) {
                let pos = getPosition(event);
                if ($scope.menuEnterPos.x != pos.x || $scope.menuEnterPos.y != pos.y) {
                    $scope.SettingsMenuVisible = false;
                }
            } else {
                $scope.SettingsMenuVisible = true;
            }
        } else {
            $scope.menuEnterPos = getPosition(event);
            $scope.SettingsMenuVisible = true;
        }

        $scope.ModelsMenuVisible = false;

        if (event) {
            event.stopPropagation();
        }

        $scope.DelayedApply(10, function() {
            resizeBody();
            resizeSettings();
        });
    }

    $scope.HideSettingsMenu = function(event, parent) {
        var elem;
        var pos = getPosition(event);
        if ($scope.menuEnterPos.x == pos.x && $scope.menuEnterPos.y == pos.y) {
            return;
        }

        if (parent) {
            elem = document.getElementById("settingsMenuChildren");
        } else {
            if ($scope.SettingsSubMenuVisible) {
                return;
            }
            elem = document.getElementById("settingsMenuParent");
        }
        $scope.HideMenus(elem, pos);
    }

    $scope.HideMenus = function(elem, pos) {
        if (elem.offsetLeft <= pos.x && pos.x <= (elem.offsetLeft + elem.offsetWidth) &&
            elem.offsetTop <= pos.y && pos.y <= (elem.offsetTop + elem.offsetHeight)) {
            return;
        }

        $scope.ModelsMenuVisible = false;
        $scope.SettingsMenuVisible = false;
    }

    $scope.ViewSectionCut = function() {
        if ($scope.shapeScene) {
            if ($scope.sectioningUserCreated == false)
            {
                var sectionCut = $scope.shapeScene.GetSectionCut(false);

                // Don't create a section cut if one already exists
                if (sectionCut != undefined)
                {
                    console.log('You cannot show a section cut when one is already present in the data.');
                    $scope.sectioning = false;
                    return;
                }
            }

            var bounds = $scope.shapeScene.GetWorldBoundingBox();

            if (bounds.valid) {
                var x = (bounds.max.x + bounds.min.x) / 2;
                var y = (bounds.max.y + bounds.min.y) / 2;
                var z = (bounds.max.z + bounds.min.z) / 2;

                var sectionCut = $scope.shapeScene.GetSectionCut(true);

                if (sectionCut == undefined)
                    return;

                $scope.sectioningUserCreated = true;

                sectionCut.SetDefaultPlane(x, y, z, Module.DefaultAxis.DEFAULTZ);

                sectionCut.SetIntersectAll(true);

                sectionCut.SetEnable(true);

                $scope.sectioning = true;
            }
        }
    }

    $scope.DeleteSectionCut = function() {
        if ($scope.shapeScene) {
            var sectionCut = $scope.shapeScene.GetSectionCut(false);

            if (sectionCut != undefined)
            {
                sectionCut.SetEnable(false);
                $scope.sectioning = false;
                $scope.sectioningPlanar = true;
            }
        }
    }

    $scope.SetPlanarSectionCut = function() {
        if ($scope.shapeScene) {
            var sectionCut = $scope.shapeScene.GetSectionCut(true);

            if (sectionCut == undefined)
                return;

            sectionCut.SetPlanar();
            $scope.sectioningPlanar = true;
        }
    }

    $scope.SetQuarterCutSectionCut = function() {
        if ($scope.shapeScene) {
            var sectionCut = $scope.shapeScene.GetSectionCut(true);

            if (sectionCut == undefined)
                return;

            sectionCut.SetQuarterCut();
            $scope.sectioningPlanar = false;
        }
    }

    $scope.GetSectioningPlanarDisabled = function() {
        if (!$scope.sectioning)
            return true;

        if ($scope.sectioningPlanar)
            return true;
        else
            return false;
    }

    $scope.GetSectioningQuarterDisabled = function() {
        if (!$scope.sectioning)
            return true;

        if ($scope.sectioningPlanar)
            return false;
        else
            return true;
    }

    $scope.SetSectionCutPreset = function() {
        var sectionCut = $scope.shapeScene.GetSectionCut(true);
        if (sectionCut == undefined)
            return;

        var axis;
        if ($scope.sectioningPreset == 'X-Axis') {
            axis = Module.DefaultAxis.DEFAULTX;
        } else if ($scope.sectioningPreset == 'Y-Axis') {
            axis = Module.DefaultAxis.DEFAULTY;
        } else if ($scope.sectioningPreset == 'Z-Axis') {
            axis = Module.DefaultAxis.DEFAULTZ;
        }
        $scope.sectioningPreset = '';
        if (axis == undefined)
            return;

        var bounds = $scope.shapeScene.GetWorldBoundingBox();

        if (bounds.valid) {
            var x = (bounds.max.x + bounds.min.x) / 2;
            var y = (bounds.max.y + bounds.min.y) / 2;
            var z = (bounds.max.z + bounds.min.z) / 2;

            sectionCut.SetDefaultPlane(x, y, z, axis);

            if ($scope.sectioningPlanar)
                sectionCut.SetPlanar();
            else
                sectionCut.SetQuarterCut();
        }
    }

    $scope.AdjustModelsMenuWidth = function() {
        let modelsTopWidth = 0;

        let urlElem = document.getElementById("pvsUrlInput");
        let loadBtnElem = document.getElementById("loadbtn");

        if (urlElem && loadBtnElem) {
            let urlElemRect = urlElem.getBoundingClientRect();
            let loadBtnElemRect = loadBtnElem.getBoundingClientRect();

            if (urlElemRect && loadBtnElemRect) {
                modelsTopWidth = urlElemRect.width + loadBtnElemRect.width + 12;
            }
        }

        let modelsBottomWidth = 0;

        let maxModelWidth = 0;
        for (let i=0; i<$scope.availableModels.length; i++) {
            let modelId = 'models' + i.toString();
            let modelElem = document.getElementById(modelId);
            if (modelElem) {
                let modelElemRect = modelElem.getBoundingClientRect();
                if (modelElemRect) {
                    let modelElemWidth = modelElemRect.width;
                    if (modelElemWidth > maxModelWidth) {
                        maxModelWidth = modelElemWidth;
                    }
                }
            }
        }

        let closeBtnElem = document.getElementById("closebtn");
        if (closeBtnElem) {
            let closeBtnElemRect = closeBtnElem.getBoundingClientRect();
            if (closeBtnElemRect) {
                modelsBottomWidth = maxModelWidth + closeBtnElemRect.width + 33;
            }
        }

        if (modelsTopWidth > modelsBottomWidth) {
            document.getElementById("modelsMenuChildrenTop").style.width = modelsTopWidth;
            document.getElementById("modelsMenuChildrenBottom").style.width = modelsTopWidth;
        } else {
            document.getElementById("modelsMenuChildrenTop").style.width = modelsBottomWidth;
            document.getElementById("modelsMenuChildrenBottom").style.width = modelsBottomWidth;
        }
    }

    $scope.StopPropagation = function(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    $scope.HideModelLocationRibbon = function() {
        $scope.DelayedApply(50, function() {
            if ($scope.activeMenu == 'modellocation' &&
                $scope.webglSettings.selectionFilter != 'MODEL') {
                $scope.activeMenu = 'home';
            }
        });
    }

    $scope.HideAllMenu = function() {
        $scope.ModelsMenuVisible = false;
        $scope.SettingsMenuVisible = false;
        $scope.UpdateDisplayByClass('sub-menu-content', 'none');
    }

    $scope.ShowSubMenu = function(id, show) {
        var contentElem = document.getElementById(id + '-Content');
        if (show) {
            $scope.UpdateDisplayByClass('sub-menu-content', 'none');
            var elem = document.getElementById(id);
            let elemRect = elem.getBoundingClientRect();
            contentElem.style.left = elemRect.width;
            contentElem.style.top = elemRect.top - 4;
            contentElem.style.display = 'block';
            $scope.SettingsSubMenuVisible = true;
        } else {
            contentElem.style.display = 'none';
            $scope.SettingsSubMenuVisible = false;
        }
    }

    $scope.subMenuEnterPos = {};
    $scope.ShowSubSettingsMenu = function(event, click) {
        if (click) {
            var contentElem = document.getElementById(event.currentTarget.id + '-Content');
            if (contentElem.style.display == 'block') {
                let pos = getPosition(event);
                if ($scope.subMenuEnterPos.x != pos.x || $scope.subMenuEnterPos.y != pos.y) {
                    $scope.ShowSubMenu(event.currentTarget.id, false);
                }
            } else {
                $scope.ShowSubMenu(event.currentTarget.id, true);
            }

        } else {
            $scope.subMenuEnterPos = getPosition(event);
            $scope.ShowSubMenu(event.currentTarget.id, true);
        }

        if (event) {
            event.stopPropagation();
        }
    }

    $scope.HideSubSettingsMenu = function(event) {
        var pos = getPosition(event);
        if ($scope.subMenuEnterPos.x == pos.x && $scope.subMenuEnterPos.y == pos.y) {
            return;
        }

        var elem = document.getElementById(event.currentTarget.id + '-Content');
        var elemRect = elem.getBoundingClientRect();
        var margin = 1;
        if ((elemRect.left-margin) <= pos.x && pos.x <= (elemRect.left + elemRect.width+margin) &&
            (elemRect.top-margin) <= pos.y && pos.y <= (elemRect.top + elemRect.height+margin)) {
            return;
        }
        elem.style.display = 'none';
        $scope.SettingsSubMenuVisible = false;
    }

    $scope.HideSubSettingsChildrenMenu = function(event) {
        var pos = getPosition(event);
        var id = event.currentTarget.id.substring(0, event.currentTarget.id.lastIndexOf('-'));
        var elem = document.getElementById(id);
        var elemRect = elem.getBoundingClientRect();
        if (elemRect.left <= pos.x && pos.x <= (elemRect.left + elemRect.width) &&
            elemRect.top <= pos.y && pos.y <= (elemRect.top + elemRect.height)) {
            return;
        }
        event.currentTarget.style.display = 'none';
        $scope.SettingsSubMenuVisible = false;
    }

    $scope.SafeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest')
            this.$eval(fn);
        else
            this.$apply(fn);
    }

    $scope.DelayedApply = function(duration, fn) {
        if (angular.isDefined($scope.delayApply)) {
            $timeout.cancel($scope.delayApply);
        }
        $scope.delayApply = $timeout(function () {
            $scope.$apply(fn);
        }, duration);
    }

    $scope.SetTimer = function () {
        /*$scope.timer = $interval(function () {
            var elem = document.getElementById("progressBar");
            if (elem) {
                if ($scope.session.HasProgress()) {
                    if($scope.loadState != "Loaded"){
                        $scope.loadState = "Loading";
                    }
                    $scope.progress = $scope.session.GetProgress();

                    elem.style.width = ($scope.progress / 100) + '%';
                    $scope.loadTime = $scope.GetLoadTime();
                } else {
                    $scope.progress = 0;
                    elem.style.width = 0 + '%';
                }
            }
        }, 30);*/
    }
    $scope.StopTimer = function () {
        /*if (angular.isDefined($scope.timer)) {
            $scope.progress = $scope.session.GetProgress();
            var elem = document.getElementById("progressBar");
            if (elem) {
                elem.style.width = 0 + '%';
            }
            $interval.cancel($scope.timer);
        }*/
    }
    $scope.CancelLoad = function () {
        console.log("CancelPendingDownloads");
        $scope.session.CancelPendingDownloads();
    }

    var Statistics = function (docelem)
    {
        var renderstats = undefined;
        var statsTimer = undefined;
        var statsWidget = new StatsWidget(docelem);
        var active = false;

        return {

            renderstats: renderstats,

            ShowNextPanel : function () {
                statsWidget.ShowPanel();
            },

            ResetTimer : function()
            {
                if (angular.isDefined(statsTimer)) {
                    $interval.cancel(statsTimer);
                    statsTimer = undefined;
                }
                if (active)
                {
                    statsTimer = $interval(function () {
                        $scope.shapeView.GetRenderStats (
                            function(rs) {
                                renderstats = rs;
                            }
                        );
                        statsWidget.update(renderstats);
                    }, $scope.webglSettings.statsPollingRate);
                }
            },

            ShowStatistics : function (showStatistics) {
                active = showStatistics == true;
                this.ResetTimer();
            }
        }
    };

    $scope.stats = new Statistics(document.getElementById('renderStatistics'));
});

function StatsWidget(container) {

    function AddPanel(panel) {
        container.appendChild(panel.dom);
        return panel;
    }

    function ShowPanel() {
        for (var i = 0; i < container.children.length; i ++) {
            container.children[ i ].style.display = i === mode ? 'block' : 'none';
        }
        mode = (mode+1) % container.children.length;
    }

    function Panel(name, fg, bg) {

        var min = Infinity, max = 0, round = Math.round;
        var PR = round(window.devicePixelRatio || 1);

        var WIDTH = 100 * PR, HEIGHT = 48 * PR,
            TEXT_X = 3 * PR, TEXT_Y = 2 * PR,
            GRAPH_X = 3 * PR, GRAPH_Y = 15 * PR,
            GRAPH_WIDTH = 94 * PR, GRAPH_HEIGHT = 30 * PR;

        var canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        canvas.style.cssText = 'width:100px;height:48px;left:10px;bottom:43px;';

        var context = canvas.getContext('2d');
        context.font = 'bold ' + ( 9 * PR ) + 'px Helvetica,Arial,sans-serif';
        context.textBaseline = 'top';

        context.fillStyle = bg;
        context.fillRect(0, 0, WIDTH, HEIGHT);

        context.fillStyle = fg;
        context.fillText(name, TEXT_X, TEXT_Y);
        context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

        context.fillStyle = bg;
        context.globalAlpha = 0.9;
        context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

        function m(n) {
            var d = 2;
            x=(''+n).length,p=Math.pow,d=p(10,d);
            x-=x%3
            return Math.round(n*d/p(10,x))/d+" kMGTPE"[x/3]
        }

        return {

            dom: canvas,

            update: function (value, maxValue) {
                min = Math.min(min, value);
                max = Math.max(max, value);

                context.fillStyle = bg;
                context.globalAlpha = 1;
                context.fillRect(0, 0, WIDTH, GRAPH_Y);
                context.fillStyle = fg;
                context.fillText( m(round( value )) + ' ' + name + ' (' + m(round( min )) + '-' + m(round( max )) + ')', TEXT_X, TEXT_Y );

                context.drawImage( canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT );

                context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT );

                context.fillStyle = bg;
                context.globalAlpha = 0.9;
                context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round( ( 1 - ( value / maxValue ) ) * GRAPH_HEIGHT ) );
            }
        };
    };

    var prevTime = Date.now(), prevFrame = 0, mode = 0, fps = 0;
    var fpsPanel  = AddPanel(new Panel('FPS', '#0ff', '#002'));
    var trisPanel = AddPanel(new Panel('TRIS', '#0f0', '#020'));
    var linesPanel = AddPanel(new Panel('LINES', '#ff0', '#200'));

    ShowPanel();

    return {
        AddPanel: AddPanel,
        ShowPanel: ShowPanel,
        update: function (rs) {
            var time = parseInt(rs.timestamp);
            var frames = rs.frameCount
            if (time >= prevTime + 1000) {
                fps = ((frames - prevFrame) * 1000) / (time - prevTime);
                prevFrame = frames;
                prevTime = time;
            }

            fpsPanel.update(fps, 100);
            trisPanel.update(rs.triangleCount, 100000);
            linesPanel.update(rs.lineCount, 1000);
        },
    };
}

function PrependModelId(idpath, modelId) {
    var str = ':';
    if (modelId) {
        str += modelId;
    } else {
        str += '1';
    }

    if (idpath.length == 1 && idpath == '/') {
        return str;
    } else if (idpath.length > 1 && idpath[0] == '/') {
        str += idpath;
        return str;
    } else {
        return idpath;
    }
}

/* Draggable Dialog Box - Start*/
var _selectedDialogElement = null,
    _dialog_x_pos  = 0,
    _dialog_y_pos  = 0,
    _dialog_x_elem = 0,
    _dialog_y_elem = 0;

function _dialog_drag_init(elem) {
    _selectedDialogElement = elem;
    _dialog_x_elem = _dialog_x_pos - _selectedDialogElement.offsetLeft;
    _dialog_y_elem = _dialog_y_pos - _selectedDialogElement.offsetTop;
}

function _dialog_move_elem(e) {
    _dialog_x_pos = window.all ? window.event.clientX : e.pageX;
    _dialog_y_pos = window.all ? window.event.clientY : e.pageY;
    if (_selectedDialogElement !== null) {
        _selectedDialogElement.style.left = (_dialog_x_pos - _dialog_x_elem) + 'px';
        _selectedDialogElement.style.top  = (_dialog_y_pos - _dialog_y_elem) + 'px';
    }
}

function _dialog_destroy() {
    _selectedDialogElement = null;
}
/* Draggable Dialog Box - End */

/* encode / decode utf8 - Start */
// Use this to input multibyte characters to API
function encode_utf8(s) {
    return unescape(encodeURIComponent(s));
}

// Use this to display multibyte characters on web page
function decode_utf8(s) {
    return decodeURIComponent(escape(s));
}
/* utf encode / decode - End */

/* Get CreoView preferences - Start */
function getCreoViewPrefs(callbackFunc) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'CreoViewPreferences.json');
    xhr.send();

    xhr.onload = function() {
        if (xhr.status != 200) {
            console.error('Error ' + xhr.status + ': ' + xhr.statusText);
            callbackFunc(null);
        } else {
            callbackFunc(xhr.response);
        }
    }

    xhr.onerror = function() {
        console.error('Error ' + xhr.status + ': ' + xhr.statusText);
        callbackFunc(null);
    }
}
/* Get CreoView preferences - End */

tvModule.filter('toScale', function() {
    return function(num, scale) {
        return Number(num).toFixed(Number(scale));
    };
});

tvModule.directive('tview', function($timeout) {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template: '<div id="{{sessionId}}"></div>',
        link: function ($scope, elm, attrs, ctrl) {
            $scope.showSpinner = true;
            $scope.webglVersion = 'Version: ' + ThingView.GetFileVersion();
            ThingView.init("js/ptc/thingview/", function () { // ThingView.init should only ever be called once in a web page
                getCreoViewPrefs(function(prefsJson) {
                    if (prefsJson != null) ThingView.SetSystemPreferencesFromJson(prefsJson);
                    $scope.app = ThingView.CreateCVApplication($scope.sessionId);
                    $scope.session = $scope.app.GetSession();
                    $scope.shapeScene = $scope.session.MakeShapeScene(true);
                    $scope.shapeView = $scope.shapeScene.MakeShapeView(document.getElementById($scope.sessionId).firstChild.id, true);
                    ThingView.SetHighMemoryUsageValue(50); // MB
                    $scope.SetBackgroundColor();
                    $scope.UpdateSelectionFilter();
                    if ($scope.webglSettings.dragMode == 'YES')
                        $scope.shapeView.SetDragMode(Module.DragMode.DRAG);
                    else
                        $scope.shapeView.SetDragMode(Module.DragMode.NONE);
                    $scope.shapeView.SetDragSnap($scope.webglSettings.dragSnap == 'YES');
                    $scope.SetNavigationMode($scope.webglSettings.navMode);
                    $scope.shapeView.ShowSpinCenter($scope.webglSettings.showSpinCenter == 'YES');
                    if ($scope.webglSettings.antiAliasing == "YES")
                        $scope.shapeView.SetAntialiasingMode(Module.AntialiasingMode.SS4X);
                    else
                        $scope.shapeView.SetAntialiasingMode(Module.AntialiasingMode.NONE);
                    $scope.session.EnableCrossSiteAccess($scope.webglSettings.enableCrossSiteAccess == 'YES');
                    $scope.shapeScene.SetShapeFilters($scope.webglSettings.shapeFilters); // Turn on misc & planar annotations
                    $scope.SetSelectionColor(true);
                    $scope.SetSelectionColor(false);
                    $scope.SetInertialSpinDecayRate();
                    $scope.showSpinner = false;
                    alert(222)
                    $scope.LoadModel("sample-data/Brake/worldcar-brake-multi-figure.pvz");

                    //$scope.$apply();
                });
            });
        }
    };
});

tvModule.directive('itemslist', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template: ' \
        <div class="widthFull"> \
            <div class="row"> \
                <div class="cell headColor" style="padding: 1px 2px;">Callout ID</div> \
                <div class="cell headColor" style="padding: 1px 2px;">Label</div> \
                <div class="cell headColor">Name \
                    <input id="itemslistHierarchy" type="checkbox" style="margin: unset;" ng-model="showItemslistHierarchy" ng-true-value="\'YES\'" ng-false-value="\'NO\'" /> \
                    <label for="itemslistHierarchy" style="margin-left: -3px;">Hierarchical</label> \
                </div> \
                <div class="cell headColor" style="padding: 1px 2px;">Quantity</div> \
            </div> \
            <div id="itemList_{{$index}}" class="property-row" ng-repeat="item in itemslist" ng-click="itemListSelection(item.calloutId, $index)"> \
                <div class="cell">{{item.calloutId}}</div> \
                <div class="cell" style="text-align: left;">{{item.label}}</div> \
                <div class="cell" style="padding: 1px 2px; text-align: left;">{{GetItemsListName(item.label, item.nameTag)}}</div> \
                <div class="cell">{{item.quantity}}</div> \
                <div class="cell"> \
                <select name = "dropdown" \
                    ng-model="hideCallbackMenuChoice" \
                    ng-click="$event.stopPropagation();" \
                    ng-change="itemListMarkCallout(item.calloutId, hideCallbackMenuChoice);"> \
                    <option value = "5">Unmarked</option> \
                    <option value = "0">1</option> \
                    <option value = "1">2</option> \
                    <option value = "2">3</option> \
                    <option value = "3">4</option> \
                    <option value = "4">5</option> \
                </select> \
                </div> \
            </div> \
        </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('properties', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template: ' \
        <div class="widthFull" id="properties"> \
            <div class="row" ng-show="foundIds.length > 0"> \
                <div class="property-cell headColor">ID Path</div> \
                <div class="property-cell headColor">Instance Name</div> \
            </div> \
            <div class="property-row" ng-show="foundIds.length > 0" \
                                      ng-repeat="id in foundIds" \
                                      ng-mouseenter="HighlightPart(id.origId)" \
                                      ng-mouseleave="DehighlightPart(id.origId)"> \
                <div class="property-cell">{{id.origId}}</div> \
                <div class="property-cell">{{id.instName}}</div> \
            </div> \
            <div class="row" ng-show="foundIds.length == 0 && selection.length == 1"> \
                <div class="property-cell headColor">Name</div> \
                <div class="property-cell headColor">Category</div> \
                <div class="property-cell headColor">Value</div> \
            </div> \
            <div class="property-row" ng-show="foundIds.length == 0 && selection.length == 1" \
                                      ng-repeat="prop in instanceProperties[0]"> \
                <div class="property-cell">{{prop.name}}</div> \
                <div class="property-cell">{{prop.category}}</div> \
                <div class="property-cell">{{prop.value}}</div> \
            </div> \
            <div class="row" ng-show="foundIds.length == 0 && selection.length > 1"> \
                <div class="property-cell headColor">Part</div> \
                <div class="property-cell headColor" ng-repeat="name in propertyNames">{{name}}</div> \
            </div> \
            <div class="property-row" title="{{GetPropertybyName(prop, \'instanceName\')}}" \
                                      ng-show="foundIds.length == 0 && selection.length > 1" \
                                      ng-repeat="prop in instanceProperties" \
                                      ng-mouseenter="HighlightPart(GetPropertybyName(prop, \'strippedIdpath\'))" \
                                      ng-mouseleave="DehighlightPart(GetPropertybyName(prop, \'strippedIdpath\'))"> \
                <div class="property-cell keyColor">{{GetPropertybyName(prop, \'instanceName\')}}</div> \
                <div class="property-cell" ng-repeat="name in propertyNames"> \
                    {{GetPropertybyName(prop, name)}} \
                </div> \
            </div> \
        </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('bboxsphere', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template: ' \
        <div class="widthFull"> \
            <div class="row"> \
                <div class="cell keyColor">ID</div> \
                <div class="cell keyColor">Type</div> \
                <div class="cell keyColor">Dimension \
                    <input id="boxInfo" type="checkbox" ng-model="showBoundBoxInfo" ng-true-value="\'YES\'" ng-false-value="\'NO\'" /> \
                    <label for="boxInfo">Show Box Info</label> \
                </div> \
                <div class="cell keyColor">Update</div> \
                <div class="cell keyColor">Unsel Drag Opt.</div> \
                <div class="cell keyColor">Sel Drag Opt.</div> \
                <div class="cell keyColor">Selectable</div> \
                <div class="cell keyColor">Selected</div> \
                <div class="cell keyColor">Remove</div> \
            </div> \
            <div class="row" ng-repeat="x in boundMarkers | orderBy: id"> \
                <div class="cell">{{ x.id }}</div> \
                <div class="cell">{{ x.type }}</div> \
                <div class="cell"> \
                    <div class="table widthFull" ng-show="x.type == \'Box\'"> \
                        <div class="row" ng-show="showBoundBoxInfo != \'YES\'"> \
                            <div class="table widthFull"> \
                                <div class="cell keyColor" style="width: 10%;">Min</div> \
                                <div class="cell" style="width: 20px;">X</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.minx" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Y</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.miny" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Z</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.minz" size="8" /></div> \
                            </div> \
                        </div> \
                        <div class="row" ng-show="showBoundBoxInfo != \'YES\'"> \
                            <div class="table widthFull"> \
                                <div class="cell keyColor" style="width: 10%;">Max</div> \
                                <div class="cell" style="width: 20px;">X</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.maxx" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Y</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.maxy" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Z</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.maxz" size="8" /></div> \
                            </div> \
                        </div> \
                        <div class="row" ng-show="showBoundBoxInfo == \'YES\'"> \
                            <div class="table widthFull"> \
                                <div class="cell keyColor" style="min-width: 85px;">Position</div> \
                                <div class="cell" style="width: 20px;">X</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.posx" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Y</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.posy" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Z</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.posz" size="8" /></div> \
                            </div> \
                        </div> \
                        <div class="row" ng-show="showBoundBoxInfo == \'YES\'"> \
                            <div class="table widthFull"> \
                                <div class="cell keyColor" style="min-width: 85px;">Orientation</div> \
                                <div class="cell" style="width: 20px;">X</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.orix" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Y</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.oriy" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Z</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.oriz" size="8" /></div> \
                            </div> \
                        </div> \
                        <div class="row" ng-show="showBoundBoxInfo == \'YES\'"> \
                            <div class="table widthFull"> \
                                <div class="cell keyColor" style="min-width: 85px;">Size</div> \
                                <div class="cell" style="width: 20px;">X</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.sizex" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Y</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.sizey" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Z</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.sizez" size="8" /></div> \
                            </div> \
                        </div> \
                    </div> \
                    <div class="table widthFull" ng-show="x.type == \'Sphere\'"> \
                        <div class="row"> \
                            <div class="table widthFull"> \
                                <div class="cell keyColor">Center</div> \
                                <div class="cell" style="width: 20px;">X</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.cenx" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Y</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.ceny" size="8" /></div> \
                                <div class="cell" style="width: 20px;">Z</div> \
                                <div class="cell"><input type="text" style="text-align: center;" ng-model="x.cenz" size="8" /></div> \
                            </div> \
                        </div> \
                        <div class="row"> \
                            <div class="table widthFull"> \
                                <div class="cell keyColor">Radius</div> \
                                <div class="cell "><input type="text" style="text-align: center;" ng-model="x.radius" size="8" /></div> \
                            </div> \
                        </div> \
                    </div> \
                </div> \
                <div class="cell"> \
                    <input type="button" value="Update" ng-click="UpdateBoundingMarker(x.name)"/> \
                </div> \
                <div class="cell"> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0xF\', true)" \
                               ng-click="SetDOTranslate(x.name, \'All\', true)"> \
                               Translate \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="trans in dragOptionTranslate" \
                               ng-style="GetDOChildLabelStyle(x.name, trans.code, true)" \
                               ng-click="SetDOTranslate(x.name, trans.param, true)"> \
                               {{trans.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x70\', true)" \
                               ng-click="SetDORotate(x.name, \'All\', true)"> \
                               Rotate \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="rot in dragOptionRotate" \
                               ng-style="GetDOChildLabelStyle(x.name, rot.code, true)" \
                               ng-click="SetDORotate(x.name, rot.param, true)"> \
                               {{rot.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x3F00\', true)" \
                               ng-click="SetDOArrow(x.name, \'All\', true)"> \
                               Arrow \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="arr in dragOptionArrow" \
                               ng-style="GetDOChildLabelStyle(x.name, arr.code, true)" \
                               ng-click="SetDOArrow(x.name, arr.param, true)"> \
                               {{arr.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x3F0000\', true)" \
                               ng-click="SetDOFace(x.name, \'All\', true)"> \
                               Face \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="face in dragOptionFace" \
                               ng-style="GetDOChildLabelStyle(x.name, face.code, true)" \
                               ng-click="SetDOFace(x.name, face.param, true)"> \
                               {{face.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x1000000\', true)" \
                               ng-click="SetDOPlanar(x.name, \'All\', true)"> \
                               Planar \
                        </label> \
                    </div> \
                </div> \
                <div class="cell"> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0xF\', false)" \
                               ng-click="SetDOTranslate(x.name, \'All\', false)"> \
                               Translate \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="trans in dragOptionTranslate" \
                               ng-style="GetDOChildLabelStyle(x.name, trans.code, false)" \
                               ng-click="SetDOTranslate(x.name, trans.param, false)"> \
                               {{trans.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x70\', false)" \
                               ng-click="SetDORotate(x.name, \'All\', false)"> \
                               Rotate \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="rot in dragOptionRotate" \
                               ng-style="GetDOChildLabelStyle(x.name, rot.code, false)" \
                               ng-click="SetDORotate(x.name, rot.param, false)"> \
                               {{rot.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x3F00\', false)" \
                               ng-click="SetDOArrow(x.name, \'All\', false)"> \
                               Arrow \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="arr in dragOptionArrow" \
                               ng-style="GetDOChildLabelStyle(x.name, arr.code, false)" \
                               ng-click="SetDOArrow(x.name, arr.param, false)"> \
                               {{arr.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x3F0000\', false)" \
                               ng-click="SetDOFace(x.name, \'All\', false)"> \
                               Face \
                        </label> \
                        <label class="dragOptionChildLabel" \
                               ng-repeat="face in dragOptionFace" \
                               ng-style="GetDOChildLabelStyle(x.name, face.code, false)" \
                               ng-click="SetDOFace(x.name, face.param, false)"> \
                               {{face.name}} \
                        </label> \
                    </div> \
                    <div class="dragOptionDiv" ng-show="x.type == \'Box\'"> \
                        <label class="dragOptionParentLabel" \
                               ng-style="GetDOParentLabelStyle(x.name, \'0x1000000\', false)" \
                               ng-click="SetDOPlanar(x.name, \'All\', false)"> \
                               Planar \
                        </label> \
                    </div> \
                </div> \
                <div class="cell"> \
                    <input type="button" value="O" ng-click="SetBoundMarkerSelectable(x.name, true)"/> \
                    <input type="button" value="X" ng-click="SetBoundMarkerSelectable(x.name, false)"/> \
                </div> \
                <div class="cell"> \
                    <input type="checkbox" ng-click="SelectBoundMarker(x)" ng-model="x.selected" ng-true-value="\'YES\'" ng-false-value="\'NO\'"/> \
                </div> \
                <div class="cell"><input type="button" value="X" ng-click="RemoveBoundingMarker(x.name)"/></div> \
            </div> \
        </div> \
        ',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('markups', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template: '<div class="list"> \
                   <button class="viewableitem" ng-repeat="x in boundMarkers | orderBy: id">{{x.type}} {{x.id + 1}}</button> \
                   <button class="viewableitem" ng-repeat="x in leaderlines track by $index">{{x.type}} {{x.id}}</button> \
                   </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('selinstances', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template: '<div class="list"> \
                   <button class="viewableitem" ng-repeat="seli in selection">{{seli}}</button> \
                   </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('console', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template: '<div class="list" id="log"> \
                   </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('layers', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template:  '<div class="list"> \
                        <div class="layertitle">{{layerTargetText}}<span ng-show="layers.length>0">({{layers.length}})</span></div> \
                        <div class="layeritem" \
                             ng-repeat="layer in layers" \
                             ng-style="GetLayerStyle(layer);" \
                             ng-click="LayerClicked($event, layer);" \
                             ng-mouseenter="LayerPreselect(layer, true)" \
                             ng-mouseleave="LayerPreselect(layer, false)"> \
                            <input type="checkbox" id="{{GetLayerID(layer.name)}}" \
                                   ng-checked="GetLayerCheckState(layer)" \
                                   ng-click="SetLayerCheckState($event, layer)" />\
                            <img ng-src="{{GetLayerIcon(layer)}}" \
                                 ng-style="GetLayerIconStyle(layer)" /> \
                            <span>{{layer.name}}</span> \
                        </div> \
                    </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
     };
});

tvModule.directive('spatialfilter', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template:  '<div class="list noselect" ng-click="SpatialFilterResultClearSelection($event)"> \
                        <div class="layertitle">Spatial Filter - {{spatialFilterResult.query.type}}<span>({{spatialFilterResult.filteredItemsNum}})</span></div> \
                        <div class="viewableitem" style="padding-left: 2px; width: 99%;" \
                             ng-repeat="item in spatialFilterResult.filteredItems" \
                             ng-style="GetSpatialFilterResultStyle(item)" \
                             ng-mouseenter="SpatialFilterResultPreselect(item, true)" \
                             ng-mouseleave="SpatialFilterResultPreselect(item, false)" \
                             ng-click="SpatialFilterResultSelect($event, item)" \
                             ng-dblclick="SpatialFilterResultZoom($event, item)" \
                             title="{{item.id}}"> \
                            <span>{{item.name}}</span> \
                        </div> \
                    </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('viewables', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template:  '<div class="list"> \
                        <div class="viewables"> \
                            <a href="#" ng-click="ToggleViewablesModel();">Model \
                                <span ng-show="viewablesModelDisplay == false">({{viewStates.length + 2}})</span> \
                            </a> \
                        </div> \
                        <div ng-show="viewablesModelDisplay == true"> \
                            <button class="viewableitem" ng-show="loadState == \'Loaded\'" ng-click="SetDefaultView()">Default View</button> \
                            <button class="viewableitem" ng-show="loadState == \'Loaded\'" ng-click="SetEmptyView()">Empty View</button> \
                            <button class="viewableitem" ng-repeat="viewState in viewStates track by $index" ng-click="SetViewState(viewState.viewStateName, viewState.viewStatePath)">{{viewState.viewStateName}}</button> \
                        </div> \
                        <div class="viewables" ng-show="illustrations.length>0"> \
                            <a href="#" ng-click="ToggleViewablesFigures();">Figures \
                                <span ng-show="viewablesFiguresDisplay == false">({{illustrations.length}})</span> \
                            </a> \
                        </div> \
                        <div ng-show="viewablesFiguresDisplay == true"> \
                            <button class="viewableitem" ng-repeat="illustration in illustrations" ng-click="LoadIllustration(illustration)">{{illustration.humanReadableName}}</button> \
                        </div> \
                        <div class="viewables" ng-show="viewablesData.length>0"> \
                            <a href="#" ng-click="ToggleViewablesDocuments();">Documents \
                                <span ng-show="viewablesDocumentsDisplay == false">({{viewablesData.length}})</span> \
                            </a> \
                        </div> \
                        <div class="viewablesDocumentsDisplay" ng-show="viewablesDocumentsDisplay == true"> \
                            <div class="viewableitemDiv" ng-repeat="viewable in viewablesData track by $index">\
                                <button class="viewableitem" ng-mouseenter="ShowDocumentTooltip(viewable)" ng-mouseleave="HideDocumentTooltip(viewable)" ng-click="LoadDocument(viewable)">{{viewable.humanReadableDisplayName}}</button> \
                            </div>\
                        </div> \
                    </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('annotations', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template:  '<div class="list"> \
                        <button class="viewableitem" ng-repeat="annoset in annotationSets track by $index" ng-click="LoadAnnotationSet(annoset)">{{annoset.name}}</button> \
                    </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('viewablesData', function() {
    return {
        restrict: 'AE',
        replace: 'true',
        scope: 'true',
        template:  '<div class="list"> \
                        <ul> \
                             <button ng-repeat="viewable in viewablesData track by $index" ng-click="LoadDocument(viewable)">{{viewable}}</button> \
                        </ul> \
                    </div>',
        link: function ($scope, elm, attrs, ctrl) {
        }
    };
});

tvModule.directive('resize', function($window) {
    return function(scope, element) {
        var w = angular.element($window);
        w.bind('resize', function() {
            resizeBody();
        });
    }
});

tvModule.directive('urlChecker', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attr, mCtrl) {
            function validation(value) {
                let upValue = angular.lowercase(value);
                if (upValue.indexOf(".pvs") != -1 ||
                    upValue.indexOf(".pvz") != -1) {
                    mCtrl.$setValidity('pvspvz', true);
                } else {
                    mCtrl.$setValidity('pvspvz', false);
                }
                return value;
            }
            mCtrl.$parsers.push(validation);
        }
    };
});

tvModule.directive('colorPicker', [ '$window', function($window) {
    var tmpl = ''
        + '<div class="angular-color-picker">'
        + '    <div class="_variations" ng-style="{ backgroundColor: hueBackgroundColor }">'
        + '        <div class="_whites">'
        + '            <div class="_blacks">'
        + '                <div class="_cursor" ng-if="colorCursor" ng-style="{ left: colorCursor.x - 5 + \'px\', top: colorCursor.y - 5 + \'px\' }"></div>'
        + '                <div class="_mouse-trap" ng-mousedown="startDrag($event, \'color\')"></div>'
        + '            </div>'
        + '        </div>'
        + '    </div>'
        + '    <div class="_hues">'
        + '        <div class="_cursor" ng-style="{ top: hueCursor - 5 + \'px\' }"></div>'
        + '        <div class="_mouse-trap" ng-mousedown="startDrag($event, \'hue\')"></div>'
        + '    </div>'
        + '    <div class="_alpha" ng-show="hsva.a != undefined">'
        + '        <div class="_background"></div>'
        + '        <div class="_foreground"></div>'
        + '        <div class="_cursor" ng-style="{ top: alphaCursor - 5 + \'px\' }"></div>'
        + '        <div class="_mouse-trap" ng-mousedown="startDrag($event, \'alpha\')"></div>'
        + '    </div>'
        + '</div>';

    return {
        restrict: 'AE',
        template: tmpl,
        replace: true,
        require: '?ngModel',
        scope: {
        },

        link: function ($scope, $element, $attributes, ngModel) {
            function hsvToHexRgb(h, s, v, a) {
                if (typeof h === 'object') {
                    a = h.a;
                    s = h.s;
                    v = h.v;
                    h = h.h;
                }

                var i = Math.floor(h * 6),
                    f = h * 6 - i,
                    p = v * (1 - s),
                    q = v * (1 - f * s),
                    t = v * (1 - (1 - f) * s);

                var r, g, b;

                switch (i % 6) {
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;
                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;
                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;
                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;
                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;
                case 5:
                    r = v;
                    g = p;
                    b = q;
                    break;
                }

                r = Math.floor(r * 255) + 256;
                g = Math.floor(g * 255) + 256;
                b = Math.floor(b * 255) + 256;
                if (a == undefined) {
                    return '#'
                        + r.toString(16).slice(1)
                        + g.toString(16).slice(1)
                        + b.toString(16).slice(1);

                } else {
                    a = Math.floor(a * 255) + 256;
                    return '#'
                        + r.toString(16).toUpperCase().slice(1)
                        + g.toString(16).toUpperCase().slice(1)
                        + b.toString(16).toUpperCase().slice(1)
                        + a.toString(16).toUpperCase().slice(1);
                }
            }

            function hexRgbaToHsva(hexColor) {
                let tokens;
                if (hexColor.length == 9) {
                    tokens = /^#(..)(..)(..)(..)$/.exec(hexColor);
                } else if (hexColor.length == 7) {
                    tokens = /^#(..)(..)(..)$/.exec(hexColor);
                }

                if (tokens) {
                    var rgba = tokens.slice(1).map(function (hex) {
                        return parseInt(hex, 16) / 255; // Normalize to 1
                    });

                    var r = rgba[0],
                        g = rgba[1],
                        b = rgba[2],
                        a = rgba.length == 4 ? rgba[3] : undefined,
                        //a = rgba[3],
                        h, s,
                        v = Math.max(r, g, b),
                        diff = v - Math.min(r, g, b),
                        diffc = function (c) {
                            return (v - c) / 6 / diff + 1 / 2;
                        };

                    if (diff === 0) {
                        h = s = 0;
                    } else {
                        s = diff / v;

                        var rr = diffc(r),
                            gg = diffc(g),
                            bb = diffc(b);

                        if (r === v) {
                            h = bb - gg;
                        } else if (g === v) {
                            h = (1 / 3) + rr - bb;
                        } else if (b === v) {
                            h = (2 / 3) + gg - rr;
                        }

                        if (h < 0) {
                            h += 1;
                        } else if (h > 1) {
                            h -= 1;
                        }
                    }

                    return {
                        h: h,
                        s: s,
                        v: v,
                        a: a
                    };
                }
            }

            $scope.hsva = { h: 0, s: 0, v: 0, a: undefined };

            if (ngModel) {
                ngModel.$render = function () {
                    if (/^#[0-9A-Fa-f]{8}$/.test(ngModel.$viewValue)) {
                        $scope.color = ngModel.$viewValue;
                        $scope.hsva = hexRgbaToHsva($scope.color);
                        $scope.colorCursor = {
                            x: $scope.hsva.s * 200,
                            y: (1 - $scope.hsva.v) * 200
                        };
                    } else if (/^#[0-9A-Fa-f]{6}$/.test(ngModel.$viewValue)) {
                        $scope.color = ngModel.$viewValue;
                        $scope.hsva = hexRgbaToHsva($scope.color);
                        $scope.colorCursor = {
                            x: $scope.hsva.s * 200,
                            y: (1 - $scope.hsva.v) * 200
                        };
                    } else {
                        $scope.color = null;
                        $scope.hsva = { h: 0.5 };
                        $scope.colorCursor = null;
                    }

                    $scope.hueBackgroundColor = hsvToHexRgb($scope.hsva.h, 1, 1);
                    $scope.hueCursor = $scope.hsva.h * 200;
                    if ($scope.hsva.a != undefined)
                        $scope.alphaCursor = (1 - $scope.hsva.a) * 200;
                };
            }

            var dragSubject,
                dragRect;

            function doDrag(x, y) {
                x = Math.max(Math.min(x, dragRect.width), 0);
                y = Math.max(Math.min(y, dragRect.height), 0);

                if (dragSubject === 'hue') {
                    $scope.hueCursor = y;

                    $scope.hsva.h = y / dragRect.height;

                    $scope.hueBackgroundColor = hsvToHexRgb($scope.hsva.h, 1, 1);
                } else if (dragSubject === 'alpha') {
                    if ($scope.hsva.a != undefined) {
                        $scope.alphaCursor = y;

                        $scope.hsva.a = 1 - y / dragRect.height;
                    }
                } else {
                    $scope.colorCursor = {
                        x: x,
                        y: y
                    };

                    $scope.hsva.s = x / dragRect.width;
                    $scope.hsva.v = 1 - y / dragRect.height;
                }

                if (typeof $scope.hsva.s !== 'undefined') {
                    $scope.color = hsvToHexRgb($scope.hsva);

                    if (ngModel) {
                        ngModel.$setViewValue($scope.color);
                    }
                }
            }

            function onMouseMove(evt) {
                evt.preventDefault();

                $scope.$apply(function () {
                    doDrag(evt.clientX - dragRect.x, evt.clientY - dragRect.y);
                });
            }
            function onTouchMove(evt) {
                //evt.preventDefault();

                $scope.$apply(function() {
                    doDrag(evt.targetTouches[0].clientX - dragRect.x, evt.targetTouches[0].clientY - dragRect.y);
                });
            }
            function onMouseUp() {
                angular.element($window)
                    .off('mousemove', onMouseMove)
                    .off('touchmove', onTouchMove);
            }

            $scope.startDrag = function (evt, subject) {
                var rect = evt.target.getBoundingClientRect();

                dragSubject = subject;
                dragRect = {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };

                doDrag(evt.offsetX || evt.layerX, evt.offsetY || evt.layerY);

                angular.element($window)
                    .on('mousemove', onMouseMove)
                    .on('touchmove', onTouchMove)
                    .one('mouseup', onMouseUp)
                    .one('touchend', onMouseUp);
            };
        }
    };
}]);
