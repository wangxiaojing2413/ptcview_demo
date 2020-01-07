var ThingView2D = (function () {
    "use strict";

    var _currentCanvasId = "";
    var _parentCanvasId = "";
    //SVG VARS
    var _calloutColors = [];
    var _calloutsSelected = [];
    var _partColors = [];
    var _partsSelected = [];
    var _svgCalloutCB;
    var _zoomWindow = false;
    var _zoomButton = false;
    var _zoomButtonScale;
    //PDF VARS
    var __PDF_DOC = null;
    var __CURRENT_PAGE = 0;
    var __TOTAL_PAGES = 0;
    var __ZOOMSCALE = 1;
    var _pdfCallback = null;
    var _pageMode = "Original";
    var _cursorMode = "text";
    var _ignoreScrollEvent = false;
    var _ignoreNavScrollEvent = false;
    var _refreshingPDF = false;
    var _nextRefreshEvent = null;
    var _scrollTimer = null;
    var _marginSize = 10;
    var _zoomInScale = 1.2;
    var _zoomOutScale = 0.8;
    var _largestWidth = 0;
    var _largestHeight = 0;
    var _toolbarEnabled = false;
    var _toolbarHeight = 40;
    var _miniToolbar = false;
    var _toolbarButtonsWidth = 0;
    var _toolbarGroups = {pages: true, zoom: true, cursor: true, search: true, sidebar: true, rotate: true, print: true};
    var _toolbarGroupsLoaded = {targetFull: 13, targetMini: 4, current: 0};
    var _toolbarGroupsValues = {full: [4,2,2,1,1,2,1], mini: [0,2,0,1,0,0,0]};
    var _firstLoadedPage = 0;
    var _lastLoadedPage = 0;
    var _orderToShowPages = [];
    var _bookmarks = [];
    var _documentLoaded = false;
    var _textSelection = null;
    var _sidebarEnabled = false;
    var _navbar = {enabled: true, firstLoadedPage: 0, lastLoadedPage: 0, selectedPage: 0, bufferSize: 5};
    var _navSidebarWidth = 200;
    var _navSidebarWidthLimit = 200;
    var _navWrapperMargin = 10;
    var _navWrapperBorder = 6;
    var _bookmarksBar = {enabled: false};
    var _sidebarResize = false;
    var _searchDrag = {enabled: false, x: 0, y: 0};
    var _pageRotation = 0;
    var _print = null;
    var _printEnabled = true;
    var _prefetchedPage = null;
    var _printCallback = null;
    var _printDocCursor = "";
    var _pdfAnnotationId = -1;
    var _pdfRawAnnotationSet = null;
    var _pdfParsedAnnotationSet = [];
    var _selectedAnnotation = null;
    var _filterPdfMarkups = false;
    var _pageAnnoSetList = {};
    var _scrollOffset = null;
    
    var _pageWrapperTemplate = null;
    var _textLayerTemplate = null;
    var _annotationTemplate = null;
    var _canvasTemplate = null;
    var _navWrapperTemplate = null;
    var _printDivTemplate = null;
    var _printWrapperTemplate = null;
    var _printPageTemplate = null;
    var _printMarkupTemplate = null;

    //PDF Search
    var _searchResultsCase = false;
    var _searchResultsWord = false;
    var _searchTerm = "";
    var _searchCaseMatch = false;
    var _searchWordMatch = false;
    var _extractTextPromises = [];
    var _pageMatches = [];
    var _matchesCountTotal = 0;
    var _indexedPageNum = 0;
    var _pageContents = [];
    var _scrollMatches = false;
    var _findTimeout = null;
    var _searchState = null;
    var _dirtyMatch = false;
    var _selected = {
        pageIdx: -1,
        matchIdx: -1
    };
    var _offset = {
        pageIdx: null,
        matchIdx: null,
        wrapped: false
    };
    var _resumePageIdx = null;
    var _pendingFindMatches = Object.create(null);
    var _matchSelected = {
        pageIdx:  -1,
        matchIdx: -1
    };
    var _pagesToSearch = null;
    var _charactersToNormalize = {
        "\u2018": '\'',
        "\u2019": '\'',
        "\u201A": '\'',
        "\u201B": '\'',
        "\u201C": '"',
        "\u201D": '"',
        "\u201E": '"',
        "\u201F": '"',
        "\xBC": '1/4',
        "\xBD": '1/2',
        "\xBE": '3/4'
    };
    var _normalizationRegex = null;
    var _searchStatusMessage = {
        searching: "Searching for results...",
        enterTerm: "Enter a search term",
        notFound: "Search term not found"
    };

    function normalize(text) {
        if (!_normalizationRegex) {
            var replace = Object.keys(_charactersToNormalize).join('');
            _normalizationRegex = new RegExp("[".concat(replace, "]"), 'g');
        }
      
        return text.replace(_normalizationRegex, function (ch) {
            return _charactersToNormalize[ch];
        });
    }
    
    //Public Functions
    var returnObj = {
        //SHARED
        LoadDocument: function (viewable, parentCanvasId, model, callback){
          _LoadDocument(viewable, parentCanvasId, model, callback);  
        },
        LoadPDF: function (parentCanvasId, val, isUrl, callback){
           _LoadPdfDocument(parentCanvasId, val, isUrl, callback);
        },
        Destroy2DCanvas: function() {
            _destroy2DCanvas();
        },
        ResetTransform: function(elem){
          _resetTransform(elem);  
        },
        SetZoomOnButton: function(scale){
            if (_zoomWindow) {
                _setZoomWindow();
            }
            _setZoomOnButton(scale);
        },
        //SVG
        IsSVGSession: function() {
            return _IsSVGSession();
        },
        ResetTransformSVG: function(){
            if (_zoomButton) {
                _setZoomOnButton(_zoomButtonScale);
            }
            _resetTransform(document.getElementById(_currentCanvasId).childNodes[0]);
        },
        SetZoomWindow: function(){
            if (_zoomButton) {
                _setZoomOnButton(_zoomButtonScale);
            }
            _setZoomWindow();
        },
        GetCallouts: function(){
            return _getCallouts();
        },
        SelectCallout: function(callout){
            if(!(_calloutsSelected.indexOf(callout.id) != -1)){
                _selectCallout(callout);
            }
        },
        DeselectCallout: function(callout){
            if(_calloutsSelected.indexOf(callout.id) != -1){
                _deselectCallout(callout);
                var index = _calloutsSelected.indexOf(callout.id);
                if (index !=-1){
                    _calloutsSelected.splice(index,1);
                }
            }
        },
        GetSVGParts: function(partNo){
            return _getSVGParts(partNo);
        },
        SetSVGCalloutCallback: function(callback){
            if(typeof callback === "function"){
                _svgCalloutCB = callback;
            }
        },
        //PDF
        CreatePDFSession: function(parentCanvasId, callback) {
            _createPDFSession(parentCanvasId, callback);
        },
        SetPDFCallback: function (callback) {
            if (typeof callback === "function"){
                _pdfCallback = callback;
            }
        },
        IsPDFSession: function() {
            return _IsPDFSession();
        },
        LoadPrevPage: function (callback) {
            _LoadPrevPage(callback);
        },
        LoadNextPage: function (callback) {
            _LoadNextPage(callback);
        },
        LoadPage: function (callback, pageNo) {
            _LoadPage(callback, parseInt(pageNo));
        },
        GetCurrentPDFPage: function () {
            if (_IsPDFSession()){
                return __CURRENT_PAGE;
            }
        },
        GetTotalPDFPages: function () {
            if (_IsPDFSession()){
                return __TOTAL_PAGES;
            }
        },
        GetPdfBookmarks: function() {
            if(_IsPDFSession()){
                return _bookmarks;
            }
        },
        SetDocumentLoaded: function() {
            if(_IsPDFSession()){
                _documentLoaded = true;
            }
        },
        GetDocumentLoaded: function() {
            if(_IsPDFSession()){
                return _documentLoaded;
            }
        },
        ResetTransformPDF: function(){
            if(_zoomButton) {
                _setZoomOnButton(_zoomButtonScale);
            }
            _resetTransformPDF();
        },
        SetPageModePDF: function(pageMode){
            if(_IsPDFSession()){
                _pageMode = pageMode;
                _setPageModePDF();
            }
        },
        SetPageModePDFWithCB: function(pageMode, callback){
            if(_IsPDFSession()){
                _pageMode = pageMode;
                _setPageModePDF(callback);
            }
        },
        SetPanModePDF: function(){
            if(_IsPDFSession()){
                if (_zoomButton) {
                    _setZoomOnButton(_zoomButtonScale);
                }
                _cursorMode = "pan";
                _setUserSelect();
            }
        },
        SetTextModePDF: function(){
            if(_IsPDFSession()){
                if (_zoomButton) {
                    _setZoomOnButton(_zoomButtonScale);
                }
                _cursorMode = "text";
                _setUserSelect();
            }
        },
        SetPdfToolbar: function(parentId, enabled, groups) {
            if(_IsPDFSession()){
                var parent = document.getElementById(parentId);
                _toolbarEnabled = enabled;
                if (groups) {
                    _toolbarGroups = groups;
                    var i = 0;
                    _toolbarGroupsLoaded.targetFull = 0;
                    _toolbarGroupsLoaded.targetMini = 1;
                    for (var value in groups) {
                        if (value) {
                            _toolbarGroupsLoaded.targetFull += _toolbarGroupsValues.full[i];
                            _toolbarGroupsLoaded.targetMini += _toolbarGroupsValues.mini[i];
                        }
                        i++;
                    }
                }
                if (enabled) {
                    _DisplayDocumentToolbar(parent, _toolbarGroups);
                    _resizeDocumentToolbar(parent, _toolbarGroups);
                } else {
                    _RemoveDocumentToolbar(parent);
                }
            }
        },
        SetPdfToolbarGroups: function (groups) {
            _toolbarGroups = groups;
        },
        ShowPdfBookmark: function(bookmarkTitle) {
            if(_IsPDFSession()){
                _ShowPdfBookmark(bookmarkTitle);
            }
        },
        SearchInPdfDocument: function(searchTerm, callback, findDirection){
            if(_IsPDFSession() && searchTerm != ""){
                _SearchInPdfDocument(searchTerm, findDirection, callback);
            }
        },
        ClearPdfDocumentSearch: function () {
            if(_IsPDFSession()){
                _searchTerm = "";
                _removePdfSearchResultHighlights ();
            }
        },
        FocusNextPdfDocumentSearch: function () {
            if(_IsPDFSession() && _searchState) {
                _searchState.highlightAll = false;
                _searchState.findPrevious = false;
                _nextMatch();
            }
        },
        FocusPrevPdfDocumentSearch: function () {
            if(_IsPDFSession() && _searchState) {
                _searchState.highlightAll = false;
                _searchState.findPrevious = true;
                _nextMatch();
            }
        },
        FocusAllPdfDocumentSearch: function() {
            if(_IsPDFSession() && _searchState) {
                _searchState.highlightAll = true;
                _searchState.findPrevious = false;
                setTimeout(_checkLoadedPagesSearched, 100);
            }
        },
        SetPdfSearchCaseMatch: function (matchCase) {
            if(_IsPDFSession()){
                _searchCaseMatch = matchCase;
            }
        },
        SetPdfSearchWordMatch: function (matchWord) {
            if(_IsPDFSession()){
                _searchWordMatch = matchWord;
            }
        },
        TogglePdfSidePane: function () {
            if (_IsPDFSession()) {
                _togglePdfSidePane();
            }
        },
        RotateDocumentPages: function (clockwise) {
            if (_IsPDFSession()) {
                _RotateDocumentPages(clockwise);
            }
        },
        PrintPdf: function () {
            if (_IsPDFSession() && _printEnabled) {
                _PrintPdf(document.getElementById(_currentCanvasId).parentNode.parentNode);
            }
        },
        LoadPdfAnnotationSet: function(documentViewable, parentCanvasId, docScene, structure, annoSet, documentCallback) {
            _LoadPdfAnnotationSet(documentViewable, parentCanvasId, docScene, structure, annoSet, documentCallback);
        },
        ApplyPdfAnnotationSet: function(annoSet, documentCallback) {
            _ApplyPdfAnnotationSet(annoSet, documentCallback);
        },
        GetLoadedPdfAnnotationSetFdf: function(docScene, author, filePath, callback) {
            _GetLoadedPdfAnnotationSetFdf(docScene, author, filePath, callback);
        },
        ZoomOnButtonPdf: function(scale) {
            _zoomButtonScale = scale;
            _zoomButtonPDF();
        },
        ZoomAllButtonPdf: function(){
            if(_IsPDFSession()){
                _pageMode = "FitZoomAll";
                _setPageModePDF();
            }
        },
        GetPdfPrintBuffers: function(firstPage, lastPage, width, height, callback) {
            if(_IsPDFSession() && _printEnabled) {
                _GetPdfPrintBuffers(document.getElementById(_currentCanvasId).parentNode.parentNode, firstPage, lastPage, width, height, callback);
            }
        },
        GetSinglePdfPrintBuffer : function(pageNo, width, height, callback) {
            if(_IsPDFSession() && _printEnabled) {
                _GetPdfPrintBuffers(document.getElementById(_currentCanvasId).parentNode.parentNode, pageNo, pageNo, width, height, callback);
            }
        },
        SetPdfMarkupsFilter : function(filterOn) {
            if(_IsPDFSession()) {
                _setPdfMarkupsFilter(filterOn);
            }
        },
        GetPdfMarkupsFilter : function() {
            if (_IsPDFSession()) {
                return _filterPdfMarkups;
            }
        }
    };
    
    extendObject(ThingView, returnObj);

    //Private Functions
    
    //SHARED
    function extendObject (obj1, obj2) {
        for (var key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                obj1[key] = obj2[key];
            }
        }
        return obj1;
    }
    
    function _stringToFloatArray(string) {
        var stringArray = string.split(", ");
        var floatArray = [];
        for (var i = 0; i < stringArray.length; i++){
            floatArray.push(parseFloat(stringArray[i]));
        }
        return floatArray;
    }
    
    function _LoadDocument(viewable, parentCanvasId, model, callback){
        if(viewable && model){
            if(viewable.type==Module.ViewableType.DOCUMENT && viewable.fileSource.indexOf(".pdf", viewable.fileSource.length - 4) != -1){
                if (!_IsPDFSession()){
                    _createPDFSession(parentCanvasId, function(){
                        _cursorMode = "text";
                        _pageMode = "Original";
                        _bookmarks = [];
                        _documentLoaded = false;
                        _selectedAnnotation = null;
                        _pdfParsedAnnotationSet = [];
                        model.GetFromLoadedDataSource(viewable.idPath, viewable.index, function(val){
                            _LoadPDF(val, false, callback);
                        });
                    });
                } else {
                    _cursorMode = "text";
                    _pageMode = "Original";
                    _bookmarks = [];
                    _documentLoaded = false;
                    _selectedAnnotation = null;
                    _pdfParsedAnnotationSet = [];
                    model.GetFromLoadedDataSource(viewable.idPath, viewable.index, function(val){
                        _LoadPDF(val, false, callback);
                    });
                }
            }
            else if (viewable.type==Module.ViewableType.ILLUSTRATION && viewable.fileSource.indexOf(".svg", viewable.fileSource.length - 4) != -1){
                if(!_IsSVGSession()){
                    _createSVGSession(parentCanvasId);
                }
                model.GetFromLoadedDataSource(viewable.idPath, viewable.index, function(val){
                    _LoadSVG(decodeURIComponent(escape(val)), callback);
                });
            } else callback(false);
        } else {
            callback(false);
        }
    }

    function _LoadPdfDocument (parentCanvasId, pdfVal, isUrl, callback){
        if (parentCanvasId && pdfVal) {
            if (!_IsPDFSession()){
                _createPDFSession(parentCanvasId, function(){
                    _documentLoaded = false;
                    _cursorMode = "text";
                    _pageMode = "FitWidth";
                    _bookmarks = [];
                    _pdfAnnotationId = -1;
                    _pdfParsedAnnotationSet = [];
                    _LoadPDF(pdfVal, isUrl, callback);
                });
            } else {
                _documentLoaded = false;
                _cursorMode = "text";
                _pageMode = "FitWidth";
                _bookmarks = [];
                _pdfAnnotationId = -1;
                _pdfParsedAnnotationSet = [];
                _LoadPDF(pdfVal, isUrl, callback);
            }
        }
    }
    
    function _resetTransform(elem){
        _setTransformMatrix(elem, 1, 0, 0, 1, 0, 0);
    }
    
    function _destroy2DCanvas(){
        _removeWindowEventListenersSVG();
        _removeWindowEventListenersPDF();
        var currentCanvas =  document.getElementById(_currentCanvasId);
        var parent = currentCanvas.parentNode;
        parent.style.cursor = "auto";
        parent.removeChild(currentCanvas);
        if(_IsPDFSession()){
            _RemoveDocumentToolbar(parent.parentNode);
            _RemovePdfSideBar (parent.parentNode);
            parent.parentNode.removeChild(document.getElementById("CreoDocumentScrollWrapper"));
        }
        _currentCanvasId = "";
    }
    
    //SVG
    function _createSVGSession(parentCanvasId){
        if(_IsPDFSession()){
            _destroy2DCanvas();
        }
        else if (!_IsSVGSession()){
            ThingView.Hide3DCanvas();
        }
        _currentCanvasId = "";
        var svgWrapper = document.createElement("div");
        var parent = document.getElementById(parentCanvasId);
        svgWrapper.id = parentCanvasId + "_CreoViewSVGDiv" + ThingView.GetNextCanvasID();
        var width = parent.clientWidth;
        var height = parent.clientHeight;
        svgWrapper.setAttribute('style',"position: relative; height: 100%; width: 100%; overflow: hidden");
        parent.style.overflow = "hidden";
        var svgHolder = document.createElement("div");
        svgHolder.setAttribute("type", "image/svg+xml");
        
        var deselect = {
            x:0,
            y:0
        };
        var drag = {
            x: 0,
            y: 0,
            state: false,
        };
        var rightClickDrag = {
            x: 0,
            y: 0,
            lastY: 0,
            state: false
        };
        var zoomDrag = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            state: false
        };
        var zoomPinch = {
            xCenter: 0,
            yCenter: 0,
            oldXs : new Object(),
            oldYs : new Object(),
            newXs : new Object(),
            newYs : new Object(),
            state: false
        };
        var twoPointDrag = {
            x: 0,
            y: 0,
            state: false,
        };
        
        var rectCanvas = document.createElement("canvas");
        rectCanvas.setAttribute('style',"position: absolute; top: 0%; left: 0%");
        rectCanvas.setAttribute('width',width);
        rectCanvas.setAttribute('height',height);
        
        svgWrapper.addEventListener("wheel", _zoomOnWheelSVG);
        svgWrapper.addEventListener("dblclick", function(){
            if(!_zoomButton){
                _resetTransform(svgHolder);
            }
        },{passive: false});
        
        svgWrapper.addEventListener("mousedown", function(e){
            e.preventDefault();
            if (_zoomWindow) {
                _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
            } else if (_zoomButton) {
                _zoomOnButton(e);
            } else if (!drag.state && e.button==0) {
                _handlePanEvent(e, drag)
            } else if (!rightClickDrag.state && e.button==2) {
                _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper)
            }
            deselect.x = e.pageX;
            deselect.y = e.pageY;
        },{passive: false});
        
        svgWrapper.addEventListener("mouseup", function(e){
            e.preventDefault();
            if(_zoomWindow && zoomDrag.state){
                _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
            } else if(drag.state){
                _handlePanEvent(e, drag);
            } else if(rightClickDrag.state){
                _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper)
            }
            var target = String(e.target.className.baseVal);
            target = target != "" ? target : String(e.target.parentNode.className.baseVal);
            if(e.pageX == deselect.x && e.pageY == deselect.y && !(e.ctrlKey || e.metaKey) && !(target.indexOf("hotspot") != -1) && !(target.indexOf("callout") != -1)){
                _deselectAllCallouts();
            }
        }, {passive: false});
        
        svgWrapper.addEventListener("mousemove", function(e){
            e.preventDefault();
            if (!_zoomWindow) {
                if(drag.state){
                    _handlePanEvent(e, drag);
                } else if(rightClickDrag.state){
                    _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper);
                }
            } else if (_zoomWindow && zoomDrag.state) {
               _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
            }
        }, {passive: false});
        
        svgWrapper.addEventListener("mouseleave", function(){
            if (_zoomWindow && zoomDrag.state){
                window.addEventListener("mouseup", function(e){
                    if(_zoomWindow && zoomDrag.state){
                        _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
                    }
                });
                window.addEventListener("mousemove", function(e){
                    if (_zoomWindow && zoomDrag.state) {
                        _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
                    }
                });
            } else if(drag.state){
                window.addEventListener("mouseup", function(e){
                    if(drag.state){
                        _handlePanEvent(e, drag);
                    }
                });
                window.addEventListener("mousemove", function(e){
                    e.stopPropagation();
                    if(drag.state){
                        _handlePanEvent(e, drag);
                    }
                });
            } else if (rightClickDrag.state){
                window.addEventListener("mouseup", function(e){
                    if(rightClickDrag.state){
                        _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper)
                    }
                });
                window.addEventListener("mousemove", function(e){
                    e.stopPropagation();
                    if(rightClickDrag.state){
                        _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper)
                    }
                });
            }
        },{passive: false});
        svgWrapper.addEventListener("mouseenter", function(){
            _removeWindowEventListenersSVG(drag, rightClickDrag, svgWrapper, zoomDrag);
        },{passive: false});
        
        var touchMoved = false;        
        svgWrapper.addEventListener("touchstart", function(e){
            touchMoved = false;
            if (e.touches.length <= 1) {
                if (_zoomWindow) {
                    _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
                } else if (_zoomButton) {
                    _zoomOnButton(e);
                } else {
                    _handlePanEvent(e, drag);
                }
            } else {
                _handleZoomOnPinchEvent(e, zoomPinch);
                _handleTwoPointPanEvent(e, twoPointDrag);
            }
        },{passive: false});
        
        var lastTap = 0;
        svgWrapper.addEventListener("touchend", function(e){
            e.preventDefault();
            if (!zoomPinch.state) {
                var currTime = new Date().getTime();
                var tapLength = currTime - lastTap;
                if (tapLength < 200 && tapLength > 0){
                    if(!_zoomButton){
                        _resetTransform(svgHolder);
                        drag.state = false;
                    }
                } else if(_zoomWindow && zoomDrag.state){
                    _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
                } else if(drag.state){
                    _handlePanEvent(e, drag);
                } else if(twoPointDrag.state) {
                    _handleTwoPointPanEvent(e, twoPointDrag);
                }
                lastTap = currTime;
                e.stopPropagation();
                if(!touchMoved && !(e.ctrlKey || e.metaKey)){
                    _deselectAllCallouts();
                }
            } else {
                _handleZoomOnPinchEvent(e, zoomPinch)
                if(drag.state){
                    _handlePanEvent(e, drag);
                } 
            }
            touchMoved = false;
        }, {passive: false});
        
        svgWrapper.addEventListener("touchmove", function(e){
            e.preventDefault();
            if (!zoomPinch.state) {
                if (!_zoomWindow) {
                    if (drag.state){
                        _handlePanEvent(e, drag);
                    }
                } else if (_zoomWindow && zoomDrag.state) {
                   _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
                }
            } else  if (zoomPinch.state && e.touches.length == 2){
                _handleZoomOnPinchEvent(e, zoomPinch);
            }
            if (twoPointDrag.state) {
                _handleTwoPointPanEvent(e, twoPointDrag);
            }
            touchMoved = true;
        }, {passive: false});
        
        svgWrapper.insertBefore(svgHolder, svgWrapper.childNodes[0]);
        svgHolder.setAttribute('style',"position: relative; height: inherit; width: inherit");
        parent.insertBefore(svgWrapper, parent.childNodes[0]);
        _currentCanvasId = svgWrapper.id;
        return;
    }
        
    function _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper){
        if (e.type == "mousedown" || e.type == "touchstart") {
            zoomDrag.x1 = e.type.indexOf("touch") != -1 ? e.touches[0].pageX : e.pageX;
            zoomDrag.y1 = e.type.indexOf("touch") != -1 ? e.touches[0].pageY : e.pageY;
            zoomDrag.state = true;
            rectCanvas.getContext('2d').clearRect(0,0,parseInt(rectCanvas.width),parseInt(rectCanvas.height));
            svgWrapper.insertBefore(rectCanvas, svgWrapper.childNodes[1]);
        } else if (e.type == "mouseup" || e.type == "touchend") {
            _zoomOnWindowSVG(e, zoomDrag);
            svgWrapper.removeChild(rectCanvas);
            zoomDrag.state = false;
            _setZoomWindow();
        } else if (e.type == "mousemove" || e.type == "touchmove") {
            _drawZoomWindow(rectCanvas, zoomDrag, e);
            zoomDrag.x2 = e.type.indexOf("touch") != -1 ? e.touches[0].pageX : e.pageX;
            zoomDrag.y2 = e.type.indexOf("touch") != -1 ? e.touches[0].pageY : e.pageY;
        }
    }
    
    function _handlePanEvent(e, drag){
        if (e.type == "mousedown" || e.type == "touchstart") {
            drag.x = e.type.indexOf("touch") != -1 ? Math.floor(e.touches[0].pageX) : e.pageX;
            drag.y = e.type.indexOf("touch") != -1 ? Math.floor(e.touches[0].pageY) : e.pageY;
            drag.state = true;
        } else if (e.type == "mouseup" || e.type == "touchend") {
            document.body.style.cursor = "auto";
            drag.state = false;
        } else if (e.type == "mousemove" || e.type == "touchmove") {
            document.body.style.cursor = "url(" + ThingView.resourcePath + "/cursors/pan.cur),auto";
            _panSVG(e, drag);
        }
    }
    
    function _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper){
        if (e.type == "mousedown") {
            rightClickDrag.x = e.pageX;
            rightClickDrag.y = e.pageY;
            rightClickDrag.lastY = e.pageY;
            rightClickDrag.state = true;
            svgWrapper.oncontextmenu = function(){return true;}
        } else if (e.type == "mouseup") {
            document.body.style.cursor = "auto";
            rightClickDrag.state = false;
        } else if (e.type == "mousemove") {
            svgWrapper.oncontextmenu = function(){return false;}
            document.body.style.cursor = "url(" + ThingView.resourcePath + "/cursors/zoom.cur),auto";
            _zoomOnRightClickSVG(e, rightClickDrag);
        }        
    }
    
    function _handleZoomOnPinchEvent(e, zoomPinch){
        if (e.type == "touchstart") {
            var touchCenter = _getTouchCenter(e);
            zoomPinch.xCenter = touchCenter.x;
            zoomPinch.yCenter = touchCenter.y;
            zoomPinch.oldXs = {x0: e.touches[0].pageX, x1: e.touches[1].pageX};
            zoomPinch.oldYs = {y0: e.touches[0].pageY, y1: e.touches[1].pageY};
            zoomPinch.state = true;
        } else if (e.type == "touchend") {
            zoomPinch.state = false;
        } else if (e.type == "touchmove") {
            zoomPinch.newXs = {x0: e.touches[0].pageX, x1: e.touches[1].pageX};
            zoomPinch.newYs = {y0: e.touches[0].pageY, y1: e.touches[1].pageY};
            _zoomOnPinch(e, zoomPinch);
        }
    }
    
    function _handleTwoPointPanEvent(e, twoPointDrag){
        if (e.type == "touchstart") {
            var touchCenter = _getTouchCenter(e);
            twoPointDrag.x = touchCenter.x;
            twoPointDrag.y = touchCenter.y;
            twoPointDrag.state = true;
        } else if (e.type == "touchend") {
            twoPointDrag.state = false;
        } else if (e.type == "touchmove") {
            _panSVG(e, twoPointDrag);
        }
    }
        
    function _removeWindowEventListenersSVG(drag, rightClickDrag, svgWrapper, zoomDrag) {
        window.removeEventListener("mouseup", function(e){
            if(_zoomWindow && zoomDrag.state){
                _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
            }
        });
        window.removeEventListener("mousemove", function(e){
            if (_zoomWindow && zoomDrag.state) {
                _handleZoomWindowEvent(e, zoomDrag, rectCanvas, svgWrapper);
            }
        });
        window.removeEventListener("mouseup",function(){
            if(drag.state){
                _handlePanEvent(e, drag);
            }
        });
        window.removeEventListener("mousemove", function(e){
            e.stopPropagation();
            if(drag.state){
                _handlePanEvent(e, drag);
            }
        });
        window.removeEventListener("mouseup", function(){
            if(rightClickDrag.state){
                _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper)
            }
        });
        window.removeEventListener("mousemove", function(e){
            e.stopPropagation();
            if(rightClickDrag.state){
                _handleRightClickZoomEvent(e, rightClickDrag, svgWrapper)
            }
        });
    }
        
    function _getTransformMatrix(svgHolder){
        var svgTransform = getComputedStyle(svgHolder).getPropertyValue('transform');
        if(svgTransform=="none"){
            svgTransform = "matrix(1, 0, 0, 1, 0, 0)";
        }
        var matrix = svgTransform.replace(/[^\d.,-]/g, '').split(',').map(Number);
        return matrix;
    }
    
    function _setTransformMatrix(elem, scaleX, skewX, skewY, scaleY, transX, transY){
        var newTransform = "transform: matrix(" + scaleX + "," + skewX + "," + skewY + "," + scaleY + "," + transX + "," + transY + ")";
        var currentStyle = elem.style.cssText;
        var newStyle = "";
        if(currentStyle.indexOf("transform") != -1) {
            var i = currentStyle.indexOf("transform");
            var j = currentStyle.indexOf(";", i)+1;
            newStyle = currentStyle.substr(0, i) + currentStyle.substr(j);
        } else {
            newStyle = currentStyle;
        }
        newStyle = newStyle + newTransform;
        elem.setAttribute('style',newStyle);
    }
    
    function _getTouchCenter (e){
        var sumX = 0;
        var sumY = 0;
        for (var i=0; i < e.touches.length; i++){
            sumX += e.touches[i].pageX;
            sumY += e.touches[i].pageY;
        }        
        return {x: Math.floor(sumX / i), y: Math.floor(sumY / i)};
    }
    
    function _panSVG(e, drag){
        e.preventDefault();
        var pageX = e.type.indexOf("touch") == -1 ? e.pageX : _getTouchCenter(e).x;
        var pageY = e.type.indexOf("touch") == -1 ? e.pageY : _getTouchCenter(e).y;
        var svgHolder = document.getElementById(_currentCanvasId).childNodes[0];
        var deltaX = pageX - drag.x;
        var deltaY = pageY - drag.y;
        var matrix = _getTransformMatrix(svgHolder);
        _setTransformMatrix(svgHolder, matrix[0], matrix[1], matrix[2], matrix[3], (matrix[4] + deltaX), (matrix[5] + deltaY));
        drag.x = pageX;
        drag.y = pageY;
    }
    
    function _getElementCenter(elem) {
        var boundingRect = elem.getBoundingClientRect();
        var centerX = (boundingRect.left + boundingRect.right)/2;
        var centerY = (boundingRect.top + boundingRect.bottom)/2;
        return {x: centerX, y: centerY}
    }
    
    function _zoomOnWheelSVG(e){
        var ZOOMMODIFIER = 0.15
        var MAXZOOM = 10.0
        var MINZOOM = 0.15
        
        var svgHolder = e.currentTarget.childNodes[0];
        var center = _getElementCenter(svgHolder);
        var mouseDeltaX = (center.x - e.pageX) * ZOOMMODIFIER;
        var mouseDeltaY = (center.y - e.pageY) * ZOOMMODIFIER;

        var matrix = _getTransformMatrix(svgHolder);
        
        var delta = e.deltaY > 0 ? 1 : -1;
        
        var newScale = matrix[0] * (1 + (delta * ZOOMMODIFIER));
        if ((newScale <= MAXZOOM && delta == 1) || (newScale >= MINZOOM && delta == -1)) {
            _setTransformMatrix(svgHolder, newScale, matrix[1], matrix[2], newScale,(matrix[4] + (mouseDeltaX * delta)), (matrix[5] + (mouseDeltaY * delta)));
        }
    }
    
    function _setZoomOnButton(scale){
        if(!_zoomButtonScale || !(_zoomButton && _zoomButtonScale != scale)) {
            _zoomButton = !_zoomButton;
        }
        if(_zoomButton) {
            _zoomButtonScale = scale;
            document.body.style.cursor = "url(" + ThingView.resourcePath + "/cursors/zoom.cur),auto";
            document.addEventListener('keydown', function(e){
                if (e.key == "Escape" && _zoomButton) {
                    _setZoomOnButton(scale);
                }
            });
        } else {
            document.body.style.cursor = "auto";
            document.removeEventListener('keydown', function(e){
                if (e.key == "Escape" && _zoomButton) {
                    _setZoomOnButton(scale);
                }
            });
        }
    }
    
    function _zoomOnButton(e) {
        var MAXZOOM = 10.0
        var MINZOOM = 0.15
        
        var svgHolder = e.currentTarget.childNodes[0];
        var center = _getElementCenter(svgHolder);
        
        var pageX = e.type.indexOf("touch") != -1 ? e.touches[0].pageX : e.pageX;
        var pageY = e.type.indexOf("touch") != -1 ? e.touches[0].pageY : e.pageY;
        
        var mouseDeltaX = _zoomButtonScale < 1 ? (center.x - pageX) * (1 - _zoomButtonScale) : (center.x - pageX) * (_zoomButtonScale - 1);
        var mouseDeltaY = _zoomButtonScale < 1 ? (center.y - pageY) * (1 - _zoomButtonScale) : (center.y - pageY) * (_zoomButtonScale - 1);

        var matrix = _getTransformMatrix(svgHolder);
        
        var delta = _zoomButtonScale >= 1 ? 1 : -1;
        
        var newScale = matrix[0] * _zoomButtonScale; 
        if ((newScale <= MAXZOOM && delta == 1) || (newScale >= MINZOOM && delta == -1)) {
            _setTransformMatrix(svgHolder, newScale, matrix[1], matrix[2], newScale,(matrix[4] + (mouseDeltaX * delta)), (matrix[5] + (mouseDeltaY * delta)));
        }
    }

    function _zoomOnRightClickSVG(e, drag){
        e.preventDefault();
        var ZOOMMODIFIER = 0.05
        var MAXZOOM = 10.0
        var MINZOOM = 0.15
        
        var svgHolder = document.getElementById(_currentCanvasId).childNodes[0];
        var matrix = _getTransformMatrix(svgHolder);
        var center = _getElementCenter(svgHolder);
        var mouseDeltaX = (center.x - drag.x) * ZOOMMODIFIER;
        var mouseDeltaY = (center.y - drag.y) * ZOOMMODIFIER;
        
        var delta = (drag.lastY - e.pageY) > 0 ? 1 : (drag.lastY - e.pageY) < 0 ? -1 : 0;
        
        var newScale = matrix[0] * (1 + (delta * ZOOMMODIFIER));
        if ((newScale <= MAXZOOM && delta == 1) || (newScale >= MINZOOM && delta == -1)) {
            _setTransformMatrix(svgHolder, newScale, matrix[1], matrix[2], newScale,(matrix[4] + (delta * mouseDeltaX)), (matrix[5] + (delta * mouseDeltaY)));
        }
        drag.lastY = e.pageY;
    }
    
    function _setZoomWindow(){
        _zoomWindow = !_zoomWindow;
        if (_zoomWindow) {
            document.body.style.cursor = "url(" + ThingView.resourcePath + "/cursors/fly_rectangle.cur),auto";
            document.addEventListener('keydown', function(e){
                _zoomWindowEscapeListener(e);
            });
        } else {
            document.body.style.cursor = "auto";
            document.removeEventListener('keydown', function(e){
                _zoomWindowEscapeListener(e);
            });
        }
    }
    
    function _drawZoomWindow(rectCanvas, zoomDrag, e){
        var boundingClientRect = rectCanvas.getBoundingClientRect();
        var pageX = e.type.indexOf("touch") != -1 ? e.touches[0].pageX : e.pageX;
        var pageY = e.type.indexOf("touch") != -1 ? e.touches[0].pageY : e.pageY;
        var rectW = (pageX-boundingClientRect.left) - (zoomDrag.x1-boundingClientRect.left);
        var rectH = (pageY-boundingClientRect.top) - (zoomDrag.y1-boundingClientRect.top);
        var context = rectCanvas.getContext('2d');
        context.clearRect(0,0,parseInt(rectCanvas.width),parseInt(rectCanvas.height));
        context.strokeStyle = "#96ed14";
        context.fillStyle = "rgba(204,204,204,0.5)";
        context.lineWidth = 1;
        context.strokeRect((zoomDrag.x1-boundingClientRect.left), (zoomDrag.y1-boundingClientRect.top), rectW, rectH);
        context.fillRect((zoomDrag.x1-boundingClientRect.left), (zoomDrag.y1-boundingClientRect.top), rectW, rectH);
    }
    
    function _zoomWindowEscapeListener(e){
        if (e.key == "Escape" && _zoomWindow) {
            document.body.style.cursor = "auto";
            if(_IsSVGSession()){
                var svgWrapper = document.getElementById(_currentCanvasId);
                if(svgWrapper.childNodes.length > 1){
                    svgWrapper.removeChild(svgWrapper.childNodes[1]);
                }
            }
            _setZoomWindow();
        }
    }
    
    function _zoomOnWindowSVG(e, zoomDrag){
        var svgHolder = document.getElementById(_currentCanvasId).childNodes[0];
        
        if(zoomDrag.x1 > zoomDrag.x2){
            zoomDrag.x1 = [zoomDrag.x2, zoomDrag.x2=zoomDrag.x1][0];
        }
        if(zoomDrag.y1 > zoomDrag.y2){
            zoomDrag.y1 = [zoomDrag.y2, zoomDrag.y2=zoomDrag.y1][0];
        }
        
        var width = zoomDrag.x2 - zoomDrag.x1;
        var height = zoomDrag.y2 - zoomDrag.y1;
        var holderAspectRatio = svgHolder.clientWidth / svgHolder.clientHeight;
        var zoomAspectRatio = width / height;
        var zoomModifier = (width > height && holderAspectRatio < zoomAspectRatio) ? (svgHolder.clientWidth / width) - 1 : (svgHolder.clientHeight / height) - 1;

        var center = _getElementCenter(svgHolder);
        var newCenterX = zoomDrag.x1 + width/2;
        var newCenterY = zoomDrag.y1 + height/2;
        var deltaX = (center.x - newCenterX) * (1 + zoomModifier);
        var deltaY = (center.y - newCenterY) * (1 + zoomModifier);
        
        var matrix = _getTransformMatrix(svgHolder);
        _setTransformMatrix(svgHolder, (matrix[0] * (1 + zoomModifier)), matrix[1], matrix[2], (matrix[0] * (1 + zoomModifier)), (matrix[4] + deltaX), (matrix[5] + deltaY)); 
        
    }
    
    function _zoomOnPinch(e, zoomPinch) {
        var oldHypth = Math.sqrt(Math.pow(zoomPinch.oldXs.x0 - zoomPinch.oldXs.x1,2) + Math.pow(zoomPinch.oldYs.y0 - zoomPinch.oldYs.y1,2));
        var newHypth = Math.sqrt(Math.pow(zoomPinch.newXs.x0 - zoomPinch.newXs.x1,2) + Math.pow(zoomPinch.newYs.y0 - zoomPinch.newYs.y1,2));
        var delta = (newHypth - oldHypth);
        
        if (delta!=0) {
            var ZOOMMODIFIER = 0.015 * delta;
            var MAXZOOM = 10.0;
            var MINZOOM = 0.15;
            
            var svgHolder = e.currentTarget.childNodes[0];
            var center = _getElementCenter(svgHolder);
            var mouseDeltaX = (center.x - zoomPinch.xCenter) * ZOOMMODIFIER;
            var mouseDeltaY = (center.y - zoomPinch.yCenter) * ZOOMMODIFIER;
            
            var matrix = _getTransformMatrix(svgHolder);
            var newScale = matrix[0] * (1 + ZOOMMODIFIER);
            if(newScale <= MAXZOOM && newScale >= MINZOOM){
                _setTransformMatrix(svgHolder, newScale, matrix[1], matrix[2], newScale,(matrix[4] + mouseDeltaX), (matrix[5] + mouseDeltaY));                
            }
            
            zoomPinch.oldXs.x0 = zoomPinch.newXs.x0;
            zoomPinch.oldXs.x1 = zoomPinch.newXs.x1;
            zoomPinch.oldYs.y0 = zoomPinch.newYs.y0;
            zoomPinch.oldYs.y1 = zoomPinch.newYs.y1;
        }
    }

    function _IsSVGSession()
    {
        var retVal = false;
        if (!_currentCanvasId=="") {
            retVal = _currentCanvasId.indexOf("_CreoViewSVGDiv") != -1 ? true : false;
        }
        return retVal;
    }
    
    function _LoadSVG(val, callback){
        if(_IsSVGSession())
        {
            var canvasId = _currentCanvasId;
            var svgHolder = document.getElementById(canvasId).childNodes[0];
            _resetTransform(svgHolder);
            svgHolder.innerHTML = val;
            _setCalloutListeners(svgHolder);
            var svg = svgHolder.getElementsByTagName("svg")[0];
            svg.setAttribute('height',"100%");
            svg.setAttribute('width',"100%");
            _calloutsSelected = [];
            _partsSelected = [];
            _calloutColors = [];
            callback(true);
        }
    }
    
    function _getCallouts(){
        var svgHolder = document.getElementById(_currentCanvasId).childNodes[0];
        var callouts = svgHolder.querySelectorAll('[class^="callout"]');
        return callouts;
    }
    
    function _getSVGElementColors(elem, colorsList){
        var colors = [];
        colors[0] = elem.id;
        for (var i = 1; i < elem.childNodes.length; i++){
            colors = _addNodeColor(elem.childNodes[i], colors);
        }
        colorsList.push(colors);
    }
    
    function _addNodeColor(node, colors){
        var obj = new Object();
        if(node.nodeName == "path" || node.nodeName == "line" || node.nodeName == "text" || node.nodeName == "polyline"){
            obj['fill'] = node.getAttribute("fill") ? node.getAttribute("fill") : null;
            obj['stroke'] = node.getAttribute("stroke") ? node.getAttribute("stroke") : null;
            colors.push(obj);
        } else if(node.nodeName == "g") {
            for (var i = 0; i < node.childNodes.length; i++){
                colors = _addNodeColor(node.childNodes[i], colors);
            }
        }
        return colors;
    }
    
    function _setCalloutListeners(svgHolder){
        var hotspots = svgHolder.querySelectorAll('[class^="hotspot"]');
        if(hotspots.length==0){
            hotspots = svgHolder.querySelectorAll('[class^="callout"]');            
        }
        var startX = 0;
        var startY = 0;
        var touchMoved = false;
        for (var i=0; i < hotspots.length; i++){
            hotspots[i].addEventListener("mousedown", function(e){
                startX = e.pageX;
                startY = e.pageY;
            }, false);
            hotspots[i].addEventListener("mouseup", function(e){
                if(startX == e.pageX && startY == e.pageY){
                    if (!(e.ctrlKey || e.metaKey)) {
                        _deselectAllCallouts();
                    }
                    _toggleCalloutSelection(e);
                }
            }, false);
            hotspots[i].addEventListener("touchstart", function(e){
                touchMoved = false;
            });
            hotspots[i].addEventListener("touchmove", function(e){
                touchMoved = true;
            });
            hotspots[i].addEventListener("touchend", function(e){
                if(!touchMoved){
                    e.stopPropagation();
                    e.preventDefault();
                    if (!(e.ctrlKey || e.metaKey)) {
                        _deselectAllCallouts();
                    }
                    _toggleCalloutSelection(e);
                    touchMoved = false;
                }
            }, {passive: false});
        }
    }  
    
    function _getCalloutForToggle(e){
        var targetClass = e.currentTarget.getAttribute("class");
        if (targetClass.indexOf("callout") != -1){
            return e.currentTarget;
        } else if(targetClass.indexOf("hotspot") != -1){
            var noIndex = targetClass.indexOf("_");
            var calloutNo = targetClass.substr(noIndex);
            var svgHolder = document.getElementById(_currentCanvasId).childNodes[0];
            var callouts = svgHolder.querySelectorAll('[class^="callout"]');
            var callout;
            for (var i=0; i<callouts.length; i++){
                if(callouts[i].getAttribute('class').indexOf(calloutNo, callouts[i].getAttribute('class').length - calloutNo.length) != -1){
                    callout = callouts[i];
                }
            }
            return callout;
        } else {
            return;
        }
    }
    
    function _toggleCalloutSelection(e){
        var callout = _getCalloutForToggle(e);
        if(callout){
            if (_calloutsSelected.indexOf(callout.id) != -1){
                _deselectCallout(callout);
                var index = _calloutsSelected.indexOf(callout.id);
                if (index !=-1){
                    _calloutsSelected.splice(index,1);
                }
            } else {
                _selectCallout(callout);
            }
            if(_svgCalloutCB){
                _svgCalloutCB(callout.id);
            }
        }
    }
    
    function _setSVGElementColors(callout, mainColor, textColor){
        _setNodeColor(callout.childNodes[0], mainColor, textColor, false);
    }
    
    function _setNodeColor(node, mainColor, textColor, background){
        if(node){
            if (node.nodeName == "path") {
                if (node.getAttribute("fill")) {
                    node.setAttribute("fill", mainColor);
                    background = true;
                }
            }
            if (node.nodeName == "path" || node.nodeName == "line" || node.nodeName == "polyline") {
                node.setAttribute("stroke", mainColor);
            } else if (node.nodeName == "text") {
                if (background) {
                    node.setAttribute("fill", textColor);
                } else {
                    node.setAttribute("fill", mainColor);
                }
            } else if (node.nodeName == "g"){
                _setNodeColor(node.childNodes[0], mainColor, textColor, background);
                for (var i = 0; i < node.childNodes.length; i++) {
                    if (node.childNodes[i].nodeName == "path" && node.childNodes[i].getAttribute("fill")) {
                        background = true;
                    }
                }
            }
            _setNodeColor(node.nextSibling, mainColor, textColor, background)
        }
    }
    
    function _resetSVGElementColors (elem, colorsList){
        var colors = [];
        for (var i = 0; i < colorsList.length; i++){
            if (colorsList[i][0] == elem.id) {
                colors = colorsList[i];
                break;
            }
        }
        colors.shift();
        _resetNodeColor(elem.childNodes[0], colors);
        colorsList.splice(colorsList.indexOf(colors), 1);
    }
    
    function _resetNodeColor (node, colors){
        if (node) {
            if (node.nodeName == "line" || node.nodeName == "path" || node.nodeName == "text" || node.nodeName == "polyline") {
                var obj = colors.shift();
                if(obj['fill'] != null){
                    node.setAttribute('fill', obj['fill']);
                } else {
                    node.removeAttribute('fill');
                }
                if (obj['stroke'] != null){
                    node.setAttribute('stroke', obj['stroke']);
                } else {
                    node.removeAttribute('stroke');
                }
            } else if (node.nodeName == "g") {
                _resetNodeColor(node.childNodes[0], colors);
            }
            _resetNodeColor(node.nextSibling, colors);
        }
    }
    
    function _selectCallout(callout){
        _getSVGElementColors(callout, _calloutColors);
        _setSVGElementColors(callout, "rgb(102,153,255)", "rgb(255,255,255)");
        _calloutsSelected.push(callout.id);
        var parts = _getSVGParts(callout.getElementsByTagName("desc")[0].textContent);
        if(parts.length > 0){
        _selectSVGPart(parts);
        }
    }
    
    function _deselectAllCallouts(){
        for (var j=0; j<_calloutsSelected.length; j++){
            var callout = document.getElementById(_calloutsSelected[j]);
            _deselectCallout(callout);
            if(_svgCalloutCB) {
                _svgCalloutCB(callout.id);
            }
        }
        _calloutsSelected = [];
    }
    
    function _deselectCallout(callout){
        _resetSVGElementColors(callout, _calloutColors);
        var parts = _getSVGParts(callout.getElementsByTagName("desc")[0].textContent);
        if(parts.length > 0){
        _deselectSVGPart(parts);
        }
    }
    
    function _getSVGParts(partNo){
        return document.getElementsByClassName("part part_" + partNo);
    }
  
    function _selectSVGPart(parts){
        for (var i = 0; i < parts.length; i++){
            var part = parts.item(i);
            if(part){
                _getSVGElementColors(part, _partColors);
                _setSVGElementColors(part, "rgb(102,153,255)", "rgb(0,0,0)");
                _partsSelected.push(part.id);
            }
        }
    }
    
    function _deselectSVGPart(parts){
        for (var i = 0; i < parts.length; i++){
            var part = parts.item(i);
            if(part){
                _resetSVGElementColors(part, _partColors);
                var index = _partsSelected.indexOf(part.id);
                if (index !=-1){
                    _partsSelected.splice(index,1);
                }
            }
        }
    }
    
    //PDF
    function _createPDFSession(parentCanvasId, callback) {
        
        if(_IsSVGSession()){
            _destroy2DCanvas();
        }
        else if (!_IsPDFSession()){
            ThingView.Hide3DCanvas();
        }
        var head = document.getElementsByTagName('head').item(0);
        if (!document.getElementById("pdfjs")) {
            var script_pdf = document.createElement("SCRIPT");
            script_pdf.src = ThingView.modulePath + "pdfjs/pdf.js";
            script_pdf.id = "pdfjs";
            script_pdf.async = false;
            head.appendChild(script_pdf);

            script_pdf.onload = function() {
                PDFJS.workerSrc = ThingView.modulePath + "pdfjs/pdf.worker.js";
                _buildPDFSession(parentCanvasId, callback);
            }
        } else {
            _buildPDFSession(parentCanvasId, callback);
        }
        return;
    }
    
    function _buildPDFSession(parentCanvasId, callback){
        _currentCanvasId = "";
        var canvasWrapper = document.createElement("div");
        var parent = document.getElementById(parentCanvasId);
        _parentCanvasId = parentCanvasId;
        parent.style.fontSize = "12pt";
        canvasWrapper.id = parentCanvasId + "_CreoViewDocumentCanvas" + ThingView.GetNextCanvasID();
        canvasWrapper.setAttribute('style', "min-height: 100%; background-color: #80858E; position: absolute;")
        
        var scrollWrapper = document.createElement("div");
        scrollWrapper.id = "CreoDocumentScrollWrapper";
        scrollWrapper.setAttribute('style', "overflow-y: scroll; overflow-x: auto; -ms-overflow-style: scrollbar; position: relative; height: 100%; -webkit-overflow-scrolling: touch; background-color: rgb(128, 133, 142);");
        scrollWrapper.appendChild(canvasWrapper);
        parent.insertBefore(scrollWrapper, parent.childNodes[0]);
        parent.style.overflow = "hidden";
        parent.style.backgroundColor = "#80858E"
        _currentCanvasId = canvasWrapper.id;        
        if ((/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) || /android/.test(navigator.userAgent)) {
            _printEnabled = false;
            _toolbarGroups.print = false;
        } else if (_printEnabled) {
            _addPdfPrintClass(parent);
        }
        _RemoveDocumentToolbar (parent)
        if (_toolbarEnabled){
            _DisplayDocumentToolbar(parent, _toolbarGroups);
        }                
        var drag = {
            x: 0,
            y: 0,
            state: false,
        };
        
        window.addEventListener("keydown", _changePageOnKey);
        
        window.addEventListener("resize", _handleBrowserResize);

        scrollWrapper.addEventListener("scroll", _handlePagesOnScroll);

        scrollWrapper.addEventListener("wheel", _handlePageOnWheel);
        
        canvasWrapper.addEventListener("wheel", _changePageOnScroll);
        
        canvasWrapper.addEventListener("mousedown", function(e){
            if (!_documentLoaded) return;

            if (_zoomButton) {
                _zoomButtonPDF();
            } else if (_cursorMode == "pan" && e.button == 0) {
                _handlePanEventPDF(e, drag);
            }

            _removePdfSearchResultHighlights();
        });
        
        canvasWrapper.addEventListener("mouseup", function(e){
            if (!_documentLoaded) return;

            if (drag.state) {
                _handlePanEventPDF(e, drag);
            }
        });
        
        canvasWrapper.addEventListener("mousemove", function(e){
            if (!_documentLoaded) return;
            
            if (drag.state) {
                _handlePanEventPDF(e, drag);
            }
        });
        
        canvasWrapper.addEventListener("mouseleave", function(e){
            if (drag.state){
                window.addEventListener("mousemove", function(e){
                    if (drag.state) {
                        _handlePanEventPDF(e, drag);
                    }
                });
                window.addEventListener("mouseup", function(e){
                    if (drag.state) {
                        _handlePanEventPDF(e, drag);
                    }
                });
            }
        });
        
        canvasWrapper.addEventListener("mouseenter", function(e){
            window.removeEventListener("mousemove", function(e){
                    if (drag.state) {
                        _handlePanEventPDF(e, drag);
                    }
                });
            window.removeEventListener("mouseup", function(e){
                    if (drag.state) {
                        _handlePanEventPDF(e, drag);
                    }
                });
        });
        
        var lastTap = 0;
        canvasWrapper.addEventListener("touchend", function(e){
            e.preventDefault();
            if (!_zoomButton) {
                var currTime = new Date().getTime();
                var tapLength = currTime - lastTap;
                if (tapLength < 200 && tapLength > 0){
                        _resetTransformPDF();
                        drag.state = false;
                    }
                lastTap = currTime;
            } else {
                _zoomButtonPDF();
            }
        });
        
        callback();
    }
    
    function _getPDFCanvas() {
        var sessionCanvas = document.createElement("canvas");
        sessionCanvas.style.display = "inline-block";
        sessionCanvas.oncontextmenu = function (e) {
            e.preventDefault();
            return false;
        };
        return sessionCanvas;
    }
    
    function _removeWindowEventListenersPDF() {
        window.removeEventListener("resize", _handleBrowserResize);
        window.removeEventListener("keydown", _changePageOnKey);
        window.removeEventListener("mousemove", function(e){
            if (drag.state) {
                _handlePanEventPDF(e, drag);
            }
        });
        window.removeEventListener("mouseup", function(e){
            if (drag.state) {
                _handlePanEventPDF(e, drag);
            }
        });
        if (_printEnabled) {
            window.removeEventListener('afterprint', _removePdfPrintDiv);
        }
        document.getElementById(_currentCanvasId).parentNode.removeEventListener("scroll", _changePageOnScroll);
        //The following has been commented out to disable move and delete for the CV 6.1 release
        /* document.getElementById(_currentCanvasId).removeEventListener("mousedown", _deselectPdfAnnotation);
        window.removeEventListener("keydown", _deletePdfAnnotationEvent); */
    }
    
    function _handlePanEventPDF(e, drag) {
        if (e.type == "mousedown") {
            drag.x = e.pageX;
            drag.y = e.pageY;
            drag.state = true;
        } else if (e.type == "mousemove") {
            document.body.style.cursor = "url(" + ThingView.resourcePath + "/cursors/pan.cur),auto";
            _panPDF(e, drag);
        } else if (e.type == "mouseup") {
            document.body.style.cursor = "auto";
            drag.state = false;
        }
    }
    
    function _panPDF(e, drag) {
        e.preventDefault();
        var deltaX = 0 - (e.pageX - drag.x);
        var deltaY = 0 - (e.pageY - drag.y);
        var scrollWrapper = document.getElementById(_currentCanvasId).parentNode;
        var scrollTop = scrollWrapper.scrollTop;
        var scrollLeft = scrollWrapper.scrollLeft;
        scrollWrapper.scrollTop = scrollTop + deltaY;
        scrollWrapper.scrollLeft = scrollLeft + deltaX;
        drag.x = e.pageX;
        drag.y = e.pageY;
    }

    function getPageHeight(page) {
        return (_marginSize + parseFloat(page.clientHeight));
    }

    function _handlePageOnWheel(evt) {
        if (!_documentLoaded) return;

        if (evt && evt.ctrlKey) {
            _zoomToCursor(evt);
            evt.preventDefault();
            return;
        }
    }

    function _changePageOnScroll(evt) {
        if (!_documentLoaded) return;

        if (evt && evt.ctrlKey) {
            evt.preventDefault();
            return;
        }

        var canvasWrapper = document.getElementById(_currentCanvasId);
        var wrapperHeight = canvasWrapper.parentNode.clientHeight;
        var scrollTop = canvasWrapper.parentNode.scrollTop;
        var scrollBottom = canvasWrapper.parentNode.scrollHeight - scrollTop - wrapperHeight;
        var firstPageQuarterHeight = document.getElementById("PdfPageDisplayWrapper1").offsetHeight / 4;
        var lastPageQuarterHeight = document.getElementById("PdfPageDisplayWrapper"+__TOTAL_PAGES).offsetHeight / 4;
        if (scrollTop < firstPageQuarterHeight) {
            __CURRENT_PAGE = 1;
        } else if (scrollBottom < lastPageQuarterHeight) {
            __CURRENT_PAGE = __TOTAL_PAGES;
        } else {
            var scrollCenter = scrollTop + wrapperHeight / 2;
            for (var i=1; i<=__TOTAL_PAGES; i++) {
                var pageWrapper = document.getElementById("PdfPageDisplayWrapper" + i);
    
                var offsetTop = pageWrapper.offsetTop;
                var offsetBottom = pageWrapper.offsetTop + pageWrapper.offsetHeight + _marginSize;
                if (offsetTop <= scrollCenter && scrollCenter < offsetBottom) {
                    __CURRENT_PAGE = i;
                    break;
                }
            }
        }

        __CURRENT_PAGE = Math.max(1, __CURRENT_PAGE);
        __CURRENT_PAGE = Math.min(__CURRENT_PAGE, __TOTAL_PAGES);

        _updateDocumentToolbarPageDisplay();
        if (_pdfCallback) {
            _pdfCallback(true);
        }
    }

    function _getPageBufferSize(mode, pagesPerLine) {
        if (pagesPerLine < 4) {
            switch (mode) {
            default:
            // case 0 : refreshing pages so return reduced size 2
            case 0:
                return 2;
            // case 1 : scrolling pages so return usual 5
            case 1:
                if (_getLargestPageWidth() > _getLargestPageHeight()) {
                    return 5;
                }
                return 3;
            // case 2 : jump to page without refreshing pages
            case 2:
                return 0;
            }
        } else {
            return (2*pagesPerLine - 1);
        }
    }

    function _updateNavbar() {
        if (_sidebarEnabled && _navbar.enabled) {
            _selectNavPage(document.getElementById("PdfNavPageWrapper" + __CURRENT_PAGE), __CURRENT_PAGE);
            _scrollNavbarToPage(document.getElementById("CreoViewDocumentNavbar"), __CURRENT_PAGE);
        }
    }

    function _handlePagesOnScroll() {
        if (!_documentLoaded) return;
        _changePageOnScroll();
        if (!_ignoreScrollEvent){
            var pagesPerLine = _getNoPagesPerLine(__CURRENT_PAGE);
            var pageBufferSize = _getPageBufferSize(1, pagesPerLine);
            if (!document.getElementById("PdfPageDisplayWrapper" + __CURRENT_PAGE).firstChild) {
                _ignoreScrollEvent = true;
                showPage(__CURRENT_PAGE, function() {
                    _ignoreScrollEvent = false;
                    _showSearchResultHighlight();
                    _updateNavbar();
                }, 0);
            } else if(__CURRENT_PAGE + pagesPerLine > (_lastLoadedPage - 1) && __CURRENT_PAGE < __TOTAL_PAGES - pagesPerLine) {
                _ignoreScrollEvent = true;
                _firstLoadedPage = Math.max((__CURRENT_PAGE-pageBufferSize), 1);
                _lastLoadedPage  = Math.min(__CURRENT_PAGE + pageBufferSize + 1, __TOTAL_PAGES);
                generateOrderToShowPages(1);
                showPagesOnOrder(function() {
                    _ignoreScrollEvent = false;
                    _showSearchResultHighlight();
                    clearInvisibleWrappers();
                    _updateNavbar();
                });
            } else if (__CURRENT_PAGE - (2*pagesPerLine - 1) < _firstLoadedPage && __CURRENT_PAGE > (2*pagesPerLine - 1)) {
                _ignoreScrollEvent = true;
                _firstLoadedPage = Math.max((__CURRENT_PAGE - pageBufferSize), 1);
                _lastLoadedPage  = Math.min(__CURRENT_PAGE + pageBufferSize, __TOTAL_PAGES);
                generateOrderToShowPages(-1);
                showPagesOnOrder(function() {
                    _ignoreScrollEvent = false;
                    _showSearchResultHighlight();
                    clearInvisibleWrappers();
                    _updateNavbar();
                });
            } else if (_sidebarEnabled && _navbar.enabled) {
                _updateNavbar();
            }
        } else {
            if (_scrollTimer !== null) {
                clearTimeout(_scrollTimer);
                _scrollTimer = null;
            }
            _scrollTimer = setTimeout(function() {
                var currentPage = document.getElementById("PdfPageDisplayWrapper" + __CURRENT_PAGE);
                if (currentPage && !currentPage.childElementCount) {
                    _ignoreScrollEvent = true;
                    showPage(__CURRENT_PAGE, function() {
                        _ignoreScrollEvent = false;
                        clearInvisibleWrappers();
                        _updateNavbar();
                    }, 0);
                }
            }, 100);
        }
    }
    
    function _changePageOnKey(e) {
        if (!_documentLoaded) return;

        var keyPressed = e.key;
        if (keyPressed == "ArrowRight") {
            _LoadNextPage(_pdfCallback);
        } else if (keyPressed == "ArrowLeft") {
            _LoadPrevPage(_pdfCallback);
        } else if (keyPressed == "Home") {
            _LoadPage(_pdfCallback, 1);
        } else if (keyPressed == "End") {
            _LoadPage(_pdfCallback, __TOTAL_PAGES);
        } else if (e.keyCode == 189 && e.ctrlKey) { // '-'
            _zoomButtonScale = _zoomOutScale;
            _zoomButtonPDF();
            e.preventDefault();
        } else if (e.keyCode == 187 && e.ctrlKey) {// '='
            _zoomButtonScale = _zoomInScale;
            _zoomButtonPDF();
            e.preventDefault();
        }
    }

    function _zoomToCursor(evt) {
        if (_refreshingPDF) return;

        var newScale = __ZOOMSCALE * (evt.deltaY > 0 ? _zoomOutScale : _zoomInScale);
        if (newScale <= 0.5)
            return;

        var scrollWrapper = document.getElementById(_currentCanvasId).parentNode;
        var wrapperRect = scrollWrapper.getBoundingClientRect();
        var x = evt.clientX - wrapperRect.left;
        var y = evt.clientY - wrapperRect.top;
    
        _getScrollCenterData(newScale, {x:x,y:y});
        __ZOOMSCALE = newScale;

        _refreshPDF(function(success){
            if (success) {
                if (_pdfCallback) {
                    _pdfCallback(success);
                }
            }
        }, {zoomScale: newScale});
    }

    function _zoomButtonPDF() {
        if (_zoomButtonScale < 1.0 && __ZOOMSCALE * _zoomButtonScale <= 0.5) {
            return;
        }

        var newScale = __ZOOMSCALE * _zoomButtonScale;
        _getScrollCenterData(newScale);
        __ZOOMSCALE = newScale;
        
        _refreshPDF(function(success){
            if (success) {
                if (_pdfCallback) {
                    _pdfCallback(success);
                }
            }
        }, {zoomScale: newScale});
    }
    
    function _resetTransformPDF () {
        if(_cursorMode != "text"){
            _setPageModePDF();
        }
    }

    function _adjustWrapperSize() {
        var canvasWrapper = document.getElementById(_currentCanvasId);
        var canvasWrapperWidth = _getLargestPageWidth() + _marginSize * 2;
        canvasWrapper.style.width = canvasWrapperWidth + "px";
        canvasWrapper.style.left = Math.max((canvasWrapper.parentNode.clientWidth - canvasWrapperWidth)/2, 0) + "px";
    }
    
    function _refreshPDF(callback, value) {
        if (_refreshingPDF) {
            _nextRefreshEvent = value;
            callback(false);
            return;
        }

        if (value) {
            if (value.zoomScale)
                __ZOOMSCALE = value.zoomScale;
            if (value.pageRotation)
                _pageRotation = value.pageRotation;
        }

        _ignoreScrollEvent = true;
        _refreshingPDF = true;

        var tempPage = __CURRENT_PAGE;
        _largestWidth = _largestHeight = 0;
        _getTextSelection();
        _resizePageWrapper(1, function() {
            _adjustWrapperSize();
            _applyScrollData();
            var pagesPerLine = _getNoPagesPerLine(__CURRENT_PAGE);
            if (pagesPerLine > 1) {
                for (var i = 1; i < pagesPerLine; i++) {
                    __CURRENT_PAGE -= 1;
                    if (__CURRENT_PAGE <= 1) {
                        __CURRENT_PAGE = 1;
                        break;
                    }
                }
            }
            showPage(tempPage, function(){
                _showSearchResultHighlight();
                _showTextSelection();
                _ignoreScrollEvent = false;
                _changePageOnScroll();
                _refreshingPDF = false;
                if (_nextRefreshEvent) {
                    _refreshPDF(callback, _nextRefreshEvent);
                    _nextRefreshEvent = null;
                } else {
                    _setUserSelect();
                    _processPdfAnnotationSet();
                    callback(true);
                }
            }, 0);
        });
    }

    function _getLargestPageWidth() {
        return _largestWidth;
    }

    function _getLargestPageHeight() {
        return _largestHeight;
    }

    function _getPageWidth(canvasWrapper, pageNo) {
        var page = canvasWrapper.childNodes[pageNo-1];
        if (page) {
            return parseFloat(page.width);
        }
    }

    function _getPageHeight(canvasWrapper, pageNo) {
        var page = canvasWrapper.childNodes[pageNo-1];
        if (page) {
            return parseFloat(page.height);
        }
    }

    function _setPageModePDF(callback) {
        if (callback == null) {
            callback = _pdfCallback;
        }

        var canvasWrapper = document.getElementById(_currentCanvasId);
        var pageWidthScale  = (canvasWrapper.parentNode.clientWidth  - _marginSize * 2) / _getLargestPageWidth()  * __ZOOMSCALE;
        var pageHeightScale = (canvasWrapper.parentNode.clientHeight - _marginSize * 2) / _getLargestPageHeight() * __ZOOMSCALE;

        var scale = __ZOOMSCALE;
        _getScrollTopData(scale);
        switch (_pageMode) {
            case "FitPage":
                scale = pageHeightScale;
                break;
            case "FitWidth":
                scale = pageWidthScale;
                break;
            case "FitZoomAll":
                scale = Math.min(pageWidthScale, pageHeightScale);
                break;
            case "Original":
            case "100percent":
                scale = 1;
                break;
            case "500percent":
                scale = 5;
                break;
            case "250percent":
                scale = 2.5;
                break;
            case "200percent":
                scale = 2;
                break;
            case "75percent":
                scale = 0.75;
                break;
            case "50percent":
                scale = 0.5;
                break;
            default:
                console.log("Requested Page Mode is not supported");
                return;
        }

        if (Math.abs(__ZOOMSCALE - scale) > 0.001) {
            _getScrollTopData(scale);
            __ZOOMSCALE = scale;

            _refreshPDF(function(success){
                if (success) {
                    callback();
                }
            }, {zoomScale: __ZOOMSCALE});
        }
        
        _updateToolbarPageModeSelection();
    }

    function _updateToolbarPageModeSelection() {
        if (_toolbarEnabled && !_miniToolbar && _toolbarGroups.zoom) {
            var pageModeSelect = document.getElementById("CreoViewDocToolbarPageModeSelect");
            if (pageModeSelect) {
                document.getElementById("CreoViewDocToolbarPageModeSelect").value = _pageMode;
            }
        }
    }
    
    function _IsPDFSession() {
        var retVal = false;
        if (!_currentCanvasId=="") {
            retVal = _currentCanvasId.indexOf("_CreoViewDocumentCanvas") != -1 ? true : false ;
        }
        return retVal;
    }

    function _initializeTemplates() {
        _pageWrapperTemplate = null;
        _textLayerTemplate = null;
        _annotationTemplate = null;
        _canvasTemplate = null;
        _navWrapperTemplate = null;
        
        _printDivTemplate = null;
        _printWrapperTemplate = null;
        _printPageTemplate = null;
        _printMarkupTemplate = null;

        _prefetchedPage = null;
        _printCallback = null;
    }

    function _LoadPDF(val, isUrl, callback) {
        if(_IsPDFSession() && val) {
            _ignoreScrollEvent = true;
            __ZOOMSCALE = 1;
            __CURRENT_PAGE = 1;
            _pageRotation = 0;
            _pdfRawAnnotationSet = null;
            _pdfParsedAnnotationSet = [];
            _pageAnnoSetList = {};
            var canvasWrapper = document.getElementById(_currentCanvasId);
            if (_sidebarEnabled){
                _RemovePdfSideBar(canvasWrapper.parentNode.parentNode);
            }
            while(canvasWrapper.firstChild){
                canvasWrapper.removeChild(canvasWrapper.firstChild);
            }

            var removePasswordDialog = function() {
                var pwBGElem = document.getElementById("PasswordBackground");
                if (pwBGElem) {
                    pwBGElem.parentNode.removeChild(pwBGElem);
                }
            };
            var loadingTask;
            if (isUrl)
                loadingTask = PDFJS.getDocument(val);
            else
                loadingTask = PDFJS.getDocument({ data: val });
            loadingTask.onPassword = function(updatePassword, reason) {
                if (reason === PDFJS.PasswordResponses.NEED_PASSWORD) {
                    if (document.getElementById("PasswordBackground") == null) {
                        var passwordBG = document.createElement("div");
                        passwordBG.id = "PasswordBackground";
                        passwordBG.setAttribute('style', "width: 100%; height: 100%; background-color: lightgrey; overflow: hidden; position: absolute; top: 0px; left: 0px;");
                        
                        var passwordDiv = document.createElement("div");
                        passwordDiv.id = "PasswordContainer";
                        passwordDiv.setAttribute('style', "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 1px solid black; padding: 20px 20px 10px; margin: 3px; background-color: white;");
                        passwordBG.appendChild(passwordDiv);

                        var passwordTitle = document.createElement("div");
                        passwordTitle.setAttribute('style', "text-align: left; margin-bottom: 10px; display: block;");
                        passwordTitle.innerHTML = "Please enter a password.";
                        passwordDiv.appendChild(passwordTitle);

                        var passwordInputDiv = document.createElement("div");
                        passwordInputDiv.style.marginBottom = "10px";
                        passwordInputDiv.style.display = "block";
                        passwordDiv.appendChild(passwordInputDiv);

                        var passwordInput = document.createElement("input");
                        passwordInput.type = "password";
                        passwordInput.id = "PasswordInput";
                        passwordInput.autocomplete = "off";
                        passwordInput.style.width = "240px";
                        passwordInputDiv.appendChild(passwordInput);

                        var passwordButtonDiv = document.createElement("div");
                        passwordButtonDiv.setAttribute('style', "display: block; height: 20px; margin-bottom: 10px;");
                        passwordDiv.appendChild(passwordButtonDiv);

                        var passwordOK = document.createElement("button");
                        passwordOK.id = "PasswordOK";
                        passwordOK.innerHTML = "OK";
                        passwordOK.setAttribute('style', "width: 120px; height: 20px; float: left; margin-right: 3px;");
                        passwordButtonDiv.appendChild(passwordOK);

                        var passwordCancel = document.createElement("button");
                        passwordCancel.id = "PasswordCancel";
                        passwordCancel.innerHTML = "Cancel";
                        passwordCancel.setAttribute('style', "width: 120px; height: 20px; float: right;");
                        passwordButtonDiv.appendChild(passwordCancel);

                        var passwordMessage = document.createElement("div");
                        passwordMessage.id = "PasswordMessage";
                        passwordMessage.setAttribute('style', "display: block; color: red; text-align: left; margin-bottom: 10px;");
                        passwordDiv.appendChild(passwordMessage);

                        var parent = canvasWrapper.parentNode;
                        parent.appendChild(passwordBG);

                        passwordInput.addEventListener("keyup", function(e) {
                            if (e.keyCode === 13) { // return key
                                e.preventDefault();
                                document.getElementById("PasswordOK").click();
                            }
                        });
                        passwordOK.addEventListener("click", function(e) {
                            var pwInputElem = document.getElementById("PasswordInput");
                            var pw = pwInputElem.value;
                            pwInputElem.value = '';
                            updatePassword(pw.length ? pw : ' ');
                        });
                        passwordCancel.addEventListener("click", function(e) {
                            removePasswordDialog();
                        });
                    }
                } else if (reason === PDFJS.PasswordResponses.INCORRECT_PASSWORD) {
                    document.getElementById("PasswordMessage").innerHTML = 'That password is incorrect.<br>Please try again.';
                }
            };

            loadingTask.then(function(pdf_doc) {
                removePasswordDialog();
                
                __PDF_DOC = pdf_doc;
                __TOTAL_PAGES = __PDF_DOC.numPages;
                _firstLoadedPage = 1;
                _lastLoadedPage = Math.min(__TOTAL_PAGES, 3);
                _largestWidth = _largestHeight = 0;
                _resetSearchVariables();
                _initializeTemplates();
                generateOrderToShowPages(1);
                _preCalculateZoomScale(canvasWrapper, function() {
                    _preparePageWrapper(canvasWrapper, 1, function() {
                        _adjustWrapperSize();
                        _scrollToHorizontalCenter();
                        showPagesOnOrder(function(success) {
                            __PDF_DOC.getOutline().then(function(outline){
                                if(outline){
                                    _bookmarks = outline;
                                } else {
                                    _bookmarksBar.enabled = false;
                                    _navbar.enabled = true;
                                }
                                if (_sidebarEnabled) {
                                    if (_navbar.enabled) {
                                        _DisplayPdfNavigationBar (_CreateSideBar(canvasWrapper.parentNode.parentNode), 1);
                                    } else if (_bookmarksBar.enabled) {
                                        _DisplayPdfBookmarksBar(_CreateSideBar(canvasWrapper.parentNode.parentNode));
                                    }
                                }
                                if (_toolbarEnabled) {
                                    _resizeDocumentToolbar(canvasWrapper.parentNode.parentNode, _toolbarGroups);
                                    _updateDocumentToolbarPageDisplay();
                                }
                                _setUserSelect();
                                _ignoreScrollEvent = false;
                                _documentLoaded = true;
                                if (callback) {
                                    callback(success);
                                }
                            });
                        });
                    });
                });
            }).catch(function(error) {
                console.log("Javascript caught exception in showPDF : " + error.message);
                if (typeof callback === "function") callback(false);
            });
        }
    }

    function _preCalculateZoomScale(canvasWrapper, callback) {
        __PDF_DOC.getPage(1).then(function(page){
            var viewport = page.getViewport(1);
            var pageWidth = parseFloat(viewport.width);
            var pageHeight = parseFloat(viewport.height);
            
            var pageWidthScale  = (canvasWrapper.parentNode.clientWidth  - _marginSize * 2)  / pageWidth;
            var pageHeightScale = (canvasWrapper.parentNode.clientHeight - _marginSize * 2) / pageHeight;

            var scale = __ZOOMSCALE;
            switch(_pageMode) {
            case "FitPage":
                scale = pageHeightScale;
                break;

            case "FitWidth":
                scale = pageWidthScale;
                break;
            }

            __ZOOMSCALE = scale;

            _updateToolbarPageModeSelection();

            callback();
        });
    }

    function _resizePageWrapper(pageNo, callback) {
        var pageWrapper = document.getElementById("PdfPageDisplayWrapper" + pageNo);
        if (pageWrapper) {
            while (pageWrapper.firstChild) {
                pageWrapper.removeChild(pageWrapper.firstChild);
            }

            __PDF_DOC.getPage(pageNo).then(function(page) {
                var viewport = page.getViewport(__ZOOMSCALE, _pageRotation);
                var width = parseFloat(viewport.width);
                var height = Math.floor(parseFloat(viewport.height));
                _largestWidth = Math.max(_largestWidth, width);
                _largestHeight = Math.max(_largestHeight, height);
                pageWrapper.height = height + "px";
                pageWrapper.width = width + "px";
                pageWrapper.style.height = height + "px";
                pageWrapper.style.width = width + "px";
                pageWrapper.style.margin = _marginSize + "px auto";

                if (pageNo < __TOTAL_PAGES) {
                    _resizePageWrapper(pageNo+1, callback);
                } else {
                    if (callback) {
                        callback();
                    }
                }
            });
        }
    }
    
    function _preparePageWrapper(canvasWrapper, pageNo, callback) {
        __PDF_DOC.getPage(pageNo).then(function(page){
            var viewport = page.getViewport(__ZOOMSCALE);

            var height = Math.floor(parseFloat(viewport.height));
            var width = parseFloat(viewport.width);
            _largestWidth = Math.max(_largestWidth, width);
            _largestHeight = Math.max(_largestHeight, height);

            var pageWrapper = null;
            if (_pageWrapperTemplate == null) {
                pageWrapper = document.createElement("div");
                pageWrapper.height = height + "px";
                pageWrapper.width = width + "px";
                pageWrapper.setAttribute('style', "width: " + width + "px; height: " + height + "px; margin: " + _marginSize + "px auto; background-color: white; box-shadow: 0px 0px 6px rgba(0,0,0,0.5); position: relative;");
                pageWrapper.style.display = "block";
                pageWrapper.id = "PdfPageDisplayWrapper" + pageNo;
                pageWrapper.className = "PdfPageDisplayWrapper";

                _pageWrapperTemplate = pageWrapper.cloneNode(false);
            } else {
                pageWrapper = _pageWrapperTemplate.cloneNode(false);

                pageWrapper.height = height + "px";
                pageWrapper.width = width + "px";
                pageWrapper.style.height = height + "px";
                pageWrapper.style.width = width + "px";
                pageWrapper.id = "PdfPageDisplayWrapper" + pageNo;
            }
            canvasWrapper.appendChild(pageWrapper);
            if (pageNo < __TOTAL_PAGES) {
                _preparePageWrapper(canvasWrapper, pageNo+1, callback);
            } else {
                if (callback) {
                    callback();
                }
            }
        });
    }

    function handleNextPageOnOrder(callback) {
        var pageNo = _orderToShowPages.shift();
        if (pageNo) {
            __PDF_DOC.getPage(pageNo).then(function(newPage){
                handlePage(newPage, callback);
            });
        } else {
            if (_toolbarEnabled && !_miniToolbar && _toolbarGroups.pages){
                _UpdateDocumentToolbar();
            }
            if (callback) {
                callback(true);
            }
        }
    }

    function getTextLayer(pageNo, width, height) {
        var textLayer = null;
        if (_textLayerTemplate == null) {
            textLayer = document.createElement("div");
            textLayer.className = "PdfPageDisplayTextLayer";
            textLayer.setAttribute('style', "overflow: hidden; position: absolute; color: transparent; z-index: 2; top: 0px; left: 0px; white-space: pre;");

            _textLayerTemplate = textLayer.cloneNode(false);
        } else {
            textLayer = _textLayerTemplate.cloneNode(false);

        }
        textLayer.id = "PdfPageDisplayTextLayer" + pageNo;
        textLayer.width  = width;
        textLayer.height = height;
        textLayer.style.width  = width + "px";
        textLayer.style.height = height + "px";
        textLayer.style.opacity = "0.2";
    
        return textLayer;
    }

    function handlePage(page, callback) {
        var pageNo = page.pageNumber;
        var viewport = page.getViewport(__ZOOMSCALE, _pageRotation);
        var pageWrapper = document.getElementById("PdfPageDisplayWrapper" + pageNo);
        if (pageWrapper.childElementCount == 0) {
            var canvas = _getPDFCanvas();
            canvas.id = "PdfPageDisplayCanvas" + pageNo;
            canvas.className = "PdfPageDisplayCanvas";
            var height = parseFloat(viewport.height);
            var width = parseFloat(viewport.width);
            canvas.height = height;
            canvas.width = width;
            page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).then(function(){
                if (pageWrapper.childElementCount == 0)
                    pageWrapper.appendChild(canvas);
                var textLayer = getTextLayer(pageNo, width, height);
                if (pageWrapper.childElementCount == 1) {
                    pageWrapper.appendChild(textLayer);
                    
                    page.getTextContent({ normalizeWhitespace: true }).then(function(textContent){
                        var lineContainers = [];
                        PDFJS.renderTextLayer({
                            textContent: textContent,
                            container: textLayer,
                            viewport: viewport,
                            textDivs: lineContainers,
                            enhanceTextSelection: true
                        })._capability.promise.then(function(){
                            for (var i=lineContainers.length-1; i >= 0; i--) {
                                var textDivLeft = parseFloat(lineContainers[i].style.left);
                                var textDivRight = textDivLeft + parseFloat(lineContainers[i].width);
                                var textDivTop = parseFloat(lineContainers[i].style.top);
                                var textDivBottom = textDivTop + parseFloat(lineContainers[i].height);
                                if (textDivLeft > width || textDivRight < 0 ||
                                    textDivTop > height || textDivBottom < 0) {
                                    textLayer.removeChild(lineContainers[i]);
                                } else {
                                    lineContainers[i].style.position = "absolute";
                                    lineContainers[i].style.lineHeight = "1.0";
                                    lineContainers[i].style.transformOrigin = "left top 0px";
                                    lineContainers[i].id = textLayer.id + "_" + (i+1).toString();
                                }
                            }

                            if (!_refreshingPDF) {
                                if (_pageAnnoSetList[pageNo]) {
                                    var annoSet = [];
                                    for (var i=0;i<_pageAnnoSetList[pageNo].length;i++) {
                                        annoSet.push(_pdfParsedAnnotationSet[_pageAnnoSetList[pageNo][i]]);
                                    }
                                    _displayPdfAnnotations(annoSet);
                                }
                            }

                            handleNextPageOnOrder(callback);
                        });
                    });
                } else {
                    handleNextPageOnOrder(callback);
                }
            });
        } else {
            handleNextPageOnOrder(callback);
        }
    }

    function gotoBookmark(page_no, coordinate, callback) {
        if ((page_no > 0) && (page_no <=__TOTAL_PAGES)) {
            if(!_ignoreScrollEvent) {
                _ignoreScrollEvent = true;

                _scrollToPage(page_no, function() {
                    showPage(page_no, function() {
                        _ignoreScrollEvent = false;
                        _changePageOnScroll();
                        _updateNavbar();
                        callback(true);
                    }, 0);
                }, coordinate);
            }
        } else {
            callback(false);
        }
    }

    function gotoPage(page_no, callback) {
        if(!_ignoreScrollEvent) {
            _ignoreScrollEvent = true;

            _scrollToPage(page_no, function() {
                showPage(page_no, function() {
                    _ignoreScrollEvent = false;
                    _changePageOnScroll();
                    _updateNavbar();
                    if (callback)
                        callback(true);
                }, 0);
            });
        }
    }

    function generateOrderToShowPages(type, center) {
        var arr = [];
        var first = _firstLoadedPage,
            last  = _lastLoadedPage,
            size  = last - first + 1;
        if (type == 1) {
            // Top down
            while (arr.length < size) {
                arr.push(first++);
            }
        } else if (type == -1) {
            // Bottom up
            while (arr.length < size) {
                arr.push(last--);
            }
        } else if (type == 0 || type == 3) {
            // Center first
            var multiplier = -1;
            var index = 0;
            var curPage = center;
            while (arr.length < size) {
                curPage = curPage + index * multiplier;
                if (curPage >= first && curPage <= last)
                arr.push(curPage);

                index += 1;
                multiplier *= -1;
            }
            if (type == 3) {
                // except center
                arr.shift();
            }
        } else if (type == 2) {
            arr.push(center);
        }
        _orderToShowPages = _orderToShowPages.concat(arr);
    }

    function clearInvisibleWrappers() {
        var pageWrappers = document.getElementsByClassName("PdfPageDisplayWrapper");
        for (var i = 0; i < pageWrappers.length; i++) {
            var pageNo = (i+1);
            if (pageNo < _firstLoadedPage || pageNo > _lastLoadedPage) {
                while (pageWrappers[i].firstChild) {
                    pageWrappers[i].removeChild(pageWrappers[i].firstChild);
                }
            }
        }
    }

    function showPagesOnOrder(callback) {
        var pageNo = _orderToShowPages.shift();
        if(pageNo) {
            __PDF_DOC.getPage(pageNo).then(function(page) {
                handlePage(page, function(success) {
                    if (callback) {
                        callback(true);
                    }
                });
            });
        }
    }
    
    function showPage(page_no, callback, mode) {
        var pagesPerLine = _getNoPagesPerLine(page_no);
        var pageBufferSize = _getPageBufferSize(mode == 2 ? 2 : 0, pagesPerLine);
        _firstLoadedPage = Math.max((page_no-pageBufferSize), 1);
        _lastLoadedPage = Math.min((page_no + pageBufferSize), __TOTAL_PAGES);

        generateOrderToShowPages(mode, page_no);
        showPagesOnOrder(function(success) {
            if (mode != 2) {
                clearInvisibleWrappers();
            }
            if (callback) {
                callback(true);
            }
        });
    }

    function _scrollToHorizontalCenter() {
        var canvasWrapper = document.getElementById(_currentCanvasId);
        var offset = (canvasWrapper.parentNode.scrollWidth - canvasWrapper.parentNode.clientWidth) / 2;
        canvasWrapper.parentNode.scrollLeft = offset;
    }

    function _getScrollCenterData(scale, mouse) {
        var canvasWrapper = document.getElementById(_currentCanvasId);
        var screenScrollY = canvasWrapper.parentNode.scrollTop;
        var screenScrollX = canvasWrapper.parentNode.scrollLeft;
        var centerOffsetX = 0;
        var centerOffsetY = 0;
        if (mouse == null) {
            centerOffsetX = canvasWrapper.parentNode.clientWidth / 2;
            centerOffsetY = canvasWrapper.parentNode.clientHeight / 2;
        } else {
            centerOffsetX = mouse.x;
            centerOffsetY = mouse.y;
        }

        var offsetX = 0;
        if (mouse == null) {
            if (canvasWrapper.parentNode.scrollWidth > canvasWrapper.parentNode.clientWidth) {
                offsetX = (screenScrollX + centerOffsetX - _marginSize) * scale / __ZOOMSCALE - centerOffsetX + _marginSize;
            } else {
                offsetX = -1;
            }
        } else {
            offsetX = (screenScrollX + centerOffsetX - _marginSize) * scale / __ZOOMSCALE - centerOffsetX + _marginSize;
        }

        var pageNo = 1;
        var offsetY = 0;
        var height = 0;
        var pdfDisplays = document.getElementsByClassName("PdfPageDisplayWrapper");
        for (var i = 0; i < pdfDisplays.length;i++) {
            var pageHeight = getPageHeight(pdfDisplays[i]);

            if ((height + pageHeight) > screenScrollY) {
                pageNo = (i+1);
                offsetY = screenScrollY - height + centerOffsetY;
                if (offsetY < _marginSize) {
                    offsetY -= 10;
                } else {
                    offsetY = (offsetY - _marginSize) * scale / __ZOOMSCALE - centerOffsetY;
                }
                break;
            }

            height += pageHeight;
        }

        _scrollOffset = {pageNo: pageNo, offsetX: offsetX, offsetY: offsetY};
    }

    function _getScrollTopData(scale) {
        var canvasWrapper = document.getElementById(_currentCanvasId);
        var screenScroll = canvasWrapper.parentNode.scrollTop;

        var pageNo = 1;
        var offset = 0;
        var height = 0;
        var pdfDisplays = document.getElementsByClassName("PdfPageDisplayWrapper");
        for (var i = 0; i < pdfDisplays.length;) {
            var pagesPerLine = _getNoPagesPerLine(i+1);
            var pageHeight = getPageHeight(pdfDisplays[i]);

            if ((height + pageHeight) > screenScroll) {
                pageNo = (i+1);
                offset = screenScroll - height;
                if (offset < _marginSize) {
                    offset -= 10;
                } else {
                    offset = (offset - _marginSize) * scale / __ZOOMSCALE;
                }
                break;
            }
            
            height += pageHeight;
            i += pagesPerLine;
        }

        _scrollOffset = {pageNo: pageNo, offsetX: -1, offsetY: offset};
    }

    function _applyScrollData() {
        if (_scrollOffset) {
            var canvasWrapper = document.getElementById(_currentCanvasId);
            var scrollToY = _marginSize;

            var pdfDisplays = document.getElementsByClassName("PdfPageDisplayWrapper");
            for (var i = 1; i < _scrollOffset.pageNo;) {
                var pagesPerLine = _getNoPagesPerLine(i+1);
                var pageHeight = getPageHeight(pdfDisplays[i-1]);

                scrollToY += pageHeight;

                i += pagesPerLine;
            }

            scrollToY += _scrollOffset.offsetY;

            canvasWrapper.parentNode.scrollTop  = scrollToY;
            if (_scrollOffset.offsetX == -1) {
                var offset = (canvasWrapper.parentNode.scrollWidth - canvasWrapper.parentNode.clientWidth) / 2;
                canvasWrapper.parentNode.scrollLeft = offset;
            } else {
                canvasWrapper.parentNode.scrollLeft = _scrollOffset.offsetX;
            }

            _scrollOffset = null;
        }
    }
    
    function _scrollToPage(page_no, callback, coordinate){
        __CURRENT_PAGE = page_no;
        var canvasWrapper = document.getElementById(_currentCanvasId);
        var targetPage = document.getElementById("PdfPageDisplayWrapper" + page_no);
        var scrollToVal = targetPage.offsetTop - _marginSize;

        if (coordinate) {
            if (coordinate[1].name == "XYZ") {
                // bookmark
                if (Math.abs(_pageRotation) == 0) {
                    var scrollTopAdjust = _marginSize + parseFloat(targetPage.clientHeight) - coordinate[3] * __ZOOMSCALE;
                    scrollToVal += scrollTopAdjust;
                    canvasWrapper.parentNode.scrollLeft = _marginSize + coordinate[2] * __ZOOMSCALE;
                }
            } else {
                // search result
                canvasWrapper.parentNode.scrollLeft = Math.max(coordinate[2] - canvasWrapper.parentNode.clientWidth / 2, 0);
                scrollToVal += (coordinate[3] - canvasWrapper.parentNode.clientHeight / 2);
            }
        }

        canvasWrapper.parentNode.scrollTop = Math.max(scrollToVal, 0);
        _updateDocumentToolbarPageDisplay();
        if (callback) {
            callback(true);
        }
    }
    
    function _getNoPagesPerLine(page_no) {
        var canvasWrapper = document.getElementById(_currentCanvasId);
        if (canvasWrapper.childNodes[0].style.display == "block") {
            return 1;
        }
        var wrapperWidth = canvasWrapper.clientWidth;
        var sum = 0;
        var count = 0;
        for (var i = 0; i < page_no; i++) {
            var page = canvasWrapper.childNodes[i];
            if (page) {
                sum += parseFloat(page.width) + _marginSize;
                count += 1;
                if (sum > wrapperWidth) {
                    sum = parseFloat(page.width);
                    count = 1;
                }
            }
        }
        for (var j = page_no; j < canvasWrapper.childNodes.length; j++) {
            var page = canvasWrapper.childNodes[j];
            if (page) {
                sum += parseFloat(page.width) + _marginSize;
                if (sum > wrapperWidth) {
                    break;
                }
                count += 1;
            }
        }
        return count;
    }
    
    function _setUserSelect(){
        var elems = document.getElementsByClassName("PdfPageDisplayTextLayer");
        for (var i = 0; i < elems.length; i++) {
            elems[i].style.WebkitUserSelect = _cursorMode == "text" ? "text" : "none";
            elems[i].style.msUserSelect = _cursorMode == "text" ? "text" : "none";
            elems[i].style.MozUserSelect = _cursorMode == "text" ? "text" : "none";
        }

        if (_cursorMode == "pan") {
            // Clear all text selection
            _clearTextSelection();
        }
    }
    
    function _LoadPrevPage(callback) {
        if (__CURRENT_PAGE != 1)
            gotoPage(__CURRENT_PAGE - 1, callback);
    }
    
    function _LoadNextPage(callback) {
        if (__CURRENT_PAGE != __TOTAL_PAGES)
            gotoPage(__CURRENT_PAGE + 1, callback);
    }
    
    function _LoadPage(callback, pageNo) {
        if ((pageNo > 0) && (pageNo <=__TOTAL_PAGES))
            gotoPage(pageNo, callback);
    }
    
    //PDF TOOLBAR
    
    function _DisplayDocumentToolbar (parent, groups) {
        if (document.getElementById("CreoViewDocumentToolbar") == null) {
            _buildToolbarCover(parent);
            var toolbarDiv = document.createElement("div");
            toolbarDiv.id = "CreoViewDocumentToolbar";
            toolbarDiv.setAttribute('style',"color: #FFFFFF; background-color: #44474B; height: " + _toolbarHeight + "px; text-align: left; padding-top:1px; z-index: 1; -webkit-user-select: none; -ms-user-select: none; -moz-user-select: none;");
            _BuildDocumentToolbarContent(toolbarDiv, groups, parent);
            parent.insertBefore(toolbarDiv, parent.childNodes[0]);
            document.getElementById(_currentCanvasId).parentNode.style.height = parseInt(parent.clientHeight) - _toolbarHeight + "px";
            if (_sidebarEnabled) {
                var sidebarDiv = document.getElementById("CreoViewDocumentSidebar");
                if (sidebarDiv) {
                    sidebarDiv.style.height = parseInt(parent.clientHeight) - _toolbarHeight + "px";
                }
            }
        }
    }
    
    function _RemoveDocumentToolbar (parent) {
        var toolbarCover = document.getElementById("PdfToolbarCover");
        if (toolbarCover) {
            _toolbarGroupsLoaded.current = 0;
            parent.removeChild(toolbarCover);
        }
        var toolbarDiv = document.getElementById("CreoViewDocumentToolbar");
        if (toolbarDiv){
            parent.removeChild(toolbarDiv);
        }
        var currentCanvas = document.getElementById(_currentCanvasId);
        if (currentCanvas) {
            currentCanvas.parentNode.style.height = "100%";
        }
        if (_sidebarEnabled) {
            var sidebarDiv = document.getElementById("CreoViewDocumentSidebar");
            if (sidebarDiv) {
                sidebarDiv.style.height = "100%";
                sidebarDiv.childNodes[1].style.height = (parseInt(sidebarDiv.childNodes[1].style.height) + _toolbarHeight) + "px";
            }
        }
        if (_searchDrag.enabled){
            _searchDrag.enabled = false;
        }
        parent.removeEventListener("mousemove", function(e){
            _dragSearchBox(parent, e);
        });
        parent.removeEventListener("mouseleave", function(){
            if (_searchDrag.enabled) {
                _searchDrag.enabled = false;
            }
        });
        parent.removeEventListener("mouseup", function(){
            if (_searchDrag.enabled) {
                _searchDrag.enabled = false;
            }
        });
    }
    
    function _BuildDocumentToolbarContent (toolbarDiv, groups, parent) {
        _miniToolbar = false;
        while(toolbarDiv.firstChild){
            toolbarDiv.removeChild(toolbarDiv.firstChild);
        }
        
        var leftContainer = document.createElement("div");
        leftContainer.setAttribute('style',"float: left; height: 100%");
        var rightContainer = document.createElement("div");
        rightContainer.setAttribute('style',"float: right; height: 100%");
        var midContainer = document.createElement("div");
        midContainer.setAttribute('style',"height: " + _toolbarHeight + "px; overflow: hidden; white-space: nowrap");
        toolbarDiv.appendChild(leftContainer);
        toolbarDiv.appendChild(rightContainer);
        toolbarDiv.appendChild(midContainer);
        if (groups.sidebar) {
            leftContainer.appendChild(_buildNavbarGroup());
        }
        if (groups.pages) {
            var pagesGroup = _buildPagesGroup();
            leftContainer.appendChild(pagesGroup);
        }
        if (groups.rotate) {
            var rotateGroup = _buildRotateGroup();
            midContainer.appendChild(rotateGroup);
        }
        if (groups.zoom) {
            var zoomGroup = _buildZoomGroup();
            midContainer.appendChild(zoomGroup);
        }
        if (groups.cursor) {
            var cursorModeGroup = _buildCursorModeGroup();
            midContainer.appendChild(cursorModeGroup);
        }        
        if (groups.search) {
            var searchGroup = _BuildDocumentSearchToolbar(parent);
            searchGroup.style.float = "right";
            searchGroup.className = "CreoToolbarGroup";
            rightContainer.appendChild(searchGroup);
        }
        if (groups.print) {
            var printGroup = _buildPrintGroup(parent);
            printGroup.style.float = "right";
            rightContainer.appendChild(printGroup);
        }
    }
    
    function _buildNavbarGroup() {
        var navbarGroup = _BuildDocumentToolbarButton('/icons/pdf_sidebar.svg', true);
        navbarGroup.id = "CreoToolbarSidebarGroup";
        navbarGroup.style.margin = "auto 5px";
        if(_sidebarEnabled){
            navbarGroup.style.backgroundColor = "#232B2D";
        }
        navbarGroup.addEventListener("click", function(e){
            e.stopPropagation();
            if(!_sidebarEnabled){
                navbarGroup.style.backgroundColor = "#232B2D";
            } else {
                navbarGroup.style.backgroundColor = "inherit";
            }
            _togglePdfSidePane();
        });
        navbarGroup.addEventListener("mouseenter", function(){
            if(!_sidebarEnabled){
                navbarGroup.style.backgroundColor = "#232B2D";
            }
        });
        navbarGroup.addEventListener("mouseleave", function(){
            if(!_sidebarEnabled){
                navbarGroup.style.backgroundColor = "inherit";
            }
        });
        return navbarGroup;
    }
    
    function _buildPagesGroup() {
        var pagesGroup = document.createElement("div");
        pagesGroup.id = "CreoToolbarPagesGroup";
        pagesGroup.className = "CreoToolbarGroup";
        pagesGroup.setAttribute('style', "display: inline-block; margin-left: 15px; height: " + _toolbarHeight + "px");
        var firstPageButton = _BuildDocumentToolbarButton("/icons/pdf_first_page.svg", true);
        _AddToolbarButtonMouseOver(firstPageButton);
        firstPageButton.addEventListener("click", function(){
            _LoadPage(_pdfCallback, 1);
        });
        pagesGroup.appendChild(firstPageButton);
        var prevPageButton = _BuildDocumentToolbarButton("/icons/pdf_previous_page.svg", true);
        _AddToolbarButtonMouseOver(prevPageButton);
        prevPageButton.addEventListener("click", function(){
            _LoadPrevPage(_pdfCallback);
        });
        pagesGroup.appendChild(prevPageButton);
        
        var pageCounterSpan = _buildPagesCounter();
        pagesGroup.appendChild(pageCounterSpan);
        
        var nextPageButton = _BuildDocumentToolbarButton("/icons/pdf_next_page.svg", true);
        nextPageButton.id = "CreoToolbarPagesGroupNextPage";
        _AddToolbarButtonMouseOver(nextPageButton);
        nextPageButton.addEventListener("click", function(){
            _LoadNextPage(_pdfCallback);
        });
        pagesGroup.appendChild(nextPageButton);
        var lastPageButton = _BuildDocumentToolbarButton("/icons/pdf_last_page.svg", true);
        _AddToolbarButtonMouseOver(lastPageButton);
        lastPageButton.addEventListener("click", function(){
            _LoadPage(_pdfCallback, __TOTAL_PAGES);
        });
        pagesGroup.appendChild(lastPageButton);
        return pagesGroup;
    }
    
    function _buildRotateGroup () {
        var rotateGroup = document.createElement("div");
        rotateGroup.id = "CreoToolbarRotateGroup";
        rotateGroup.setAttribute('style', "display: inline-block; margin: auto 7px");
        rotateGroup.className = "CreoToolbarGroup";
        
        var rotateClockwiseButton = _BuildDocumentToolbarButton("/icons/pdf_rotate_clockwise.svg", true);
        rotateClockwiseButton.addEventListener("click", function(){
            _RotateDocumentPages(true);
        });
        _AddToolbarButtonMouseOver(rotateClockwiseButton);
        rotateGroup.appendChild(rotateClockwiseButton);
        
        var rotateAntiClockwiseButton = _BuildDocumentToolbarButton("/icons/pdf_rotate_anti_clockwise.svg", true);
        rotateAntiClockwiseButton.addEventListener("click", function(){
            _RotateDocumentPages(false);
        });
        _AddToolbarButtonMouseOver(rotateAntiClockwiseButton);
        rotateGroup.appendChild(rotateAntiClockwiseButton);
        
        return rotateGroup;
    }
    
    function _buildPagesCounter () {
        var pageCounterSpan = document.createElement("div");
        pageCounterSpan.id = "PageCounterSpan";
        pageCounterSpan.innerHTML = "  /  " + __TOTAL_PAGES;
        pageCounterSpan.setAttribute('style', "display: inline-block; position: absolute; margin: 10px");
        var pageCounterInput = document.createElement("input");
        pageCounterInput.id = "PageCounterInput";
        pageCounterInput.type = "text";
        pageCounterInput.pattern = "[0-9]+";
        pageCounterInput.size = "3";
        pageCounterInput.value = "1";
        pageCounterInput.addEventListener("keypress", function(e){
            if (!(e.key == "Enter" || /^\d*$/.test(e.key))) {
                e.preventDefault();
            }
        });
        pageCounterInput.addEventListener("change", function(e){
            var pageNo = parseInt(e.target.value);
            if (pageNo) {
                _LoadPage(_pdfCallback, pageNo);
            }
        });
        pageCounterSpan.insertBefore(pageCounterInput, pageCounterSpan.childNodes[0]);     
        return pageCounterSpan;
    }
    
    function _buildZoomGroup () {
        var zoomGroup = document.createElement("div");
        zoomGroup.id = "CreoToolbarZoomGroup";
        zoomGroup.className = "CreoToolbarGroup";
        zoomGroup.setAttribute('style', "display: inline-block; margin: auto 7px;");
        var zoomInButton = _BuildDocumentToolbarButton("./icons/pdf_zoom_in.svg", true);
        _AddToolbarButtonMouseOver(zoomInButton);
        zoomInButton.addEventListener("click", function(){
            _zoomButtonScale = _zoomInScale;
            _zoomButtonPDF();
        });
        zoomGroup.appendChild(zoomInButton);
        var zoomOutButton = _BuildDocumentToolbarButton("./icons/pdf_zoom_out.svg", true);
        _AddToolbarButtonMouseOver(zoomOutButton);
        zoomOutButton.addEventListener("click", function(){
            _zoomButtonScale = _zoomOutScale;
            _zoomButtonPDF();
        });
        zoomGroup.appendChild(zoomOutButton);
        
        var pageModeSpan = document.createElement("span");
        pageModeSpan.setAttribute('style', "display: inline-block; position: relative; margin-left: 5px; margin-right: 5px; top: -3px");
        
        var pageModeInput = document.createElement("select");
        pageModeInput.id = "CreoViewDocToolbarPageModeSelect";
        var pageModeTexts = ["Original", "Fit Page", "Fit Width", "500%", "250%", "200%", "100%", "75%", "50%"];
        var pageModeValues = ["Original", "FitPage", "FitWidth", "500percent", "250percent", "200percent", "100percent", "75percent", "50percent"];
        for(var i=0; i < pageModeTexts.length; i++){
            var option = document.createElement("option");
            option.text = pageModeTexts[i];
            option.value = pageModeValues[i];
            pageModeInput.appendChild(option);
        }
        pageModeInput.value = _pageMode;
        pageModeInput.addEventListener("change", function(e){
            _pageMode = e.target.options[e.target.selectedIndex].value;
            _setPageModePDF();
        });
        
        pageModeSpan.appendChild(pageModeInput);
        zoomGroup.appendChild(pageModeSpan);
        return zoomGroup;
    }
    
    function _buildCursorModeGroup(){
        var cursorModeGroup = document.createElement("div");
        cursorModeGroup.id = "CreoToolbarCursorGroup";
        cursorModeGroup.className = "CreoToolbarGroup";
        cursorModeGroup.setAttribute('style', "display: inline-block; margin: auto 7px");
        
        var panModeButton = _BuildDocumentToolbarButton("/icons/pdf_pan_view.svg", true);
        panModeButton.addEventListener("mouseenter", function(){
            if (_cursorMode != "pan") {
                panModeButton.style.backgroundColor = "#232B2D";
            }
        });
        panModeButton.addEventListener("mouseleave", function(){
            if (_cursorMode != "pan") {
                panModeButton.style.backgroundColor = "inherit";
            }
        });
        var textModeButton = _BuildDocumentToolbarButton("/icons/pdf_text_select.svg", true);
        textModeButton.addEventListener("mouseenter", function(){
            if (_cursorMode != "text") {
                textModeButton.style.backgroundColor = "#232B2D";
            }
        });
        textModeButton.addEventListener("mouseleave", function(){
            if (_cursorMode != "text") {
                textModeButton.style.backgroundColor = "inherit";
            }
        });
        
        if (_cursorMode == "pan") {
            panModeButton.style.backgroundColor = "#232B2D";
        } else if (_cursorMode == "text") {
            textModeButton.style.backgroundColor = "#232B2D";
        }
        
        panModeButton.addEventListener("mousedown", function(e){
            if (_zoomButton) {
                _setZoomOnButton(_zoomButtonScale);
            }
            _cursorMode = "pan";
            _setUserSelect();
            panModeButton.style.backgroundColor = "#232B2D";
            textModeButton.style.backgroundColor = "inherit";
        });
        cursorModeGroup.appendChild(panModeButton);
        
        textModeButton.addEventListener("mousedown", function(){
            if (_zoomButton) {
                _setZoomOnButton(_zoomButtonScale);
            }
            _cursorMode = "text";
            _setUserSelect();
            textModeButton.style.backgroundColor = "#232B2D";
            panModeButton.style.backgroundColor = "inherit";
        });
        cursorModeGroup.appendChild(textModeButton);
        
        return cursorModeGroup;
    }
    
    function _buildPrintGroup (parent) {
        var printGroup = document.createElement("div");
        printGroup.id = "CreoToolbarPrintGroup";
        printGroup.setAttribute('style', "display: inline-block; margin: auto 7px");
        printGroup.className = "CreoToolbarGroup";
        
        var printButton = _BuildDocumentToolbarButton("/icons/pdf_print.svg", true);
        printButton.addEventListener("click", function(){
            _PrintPdf(parent);
        });
        _AddToolbarButtonMouseOver(printButton);
        printGroup.appendChild(printButton);
        
        return printGroup;
    }
    
    function _UpdateDocumentToolbar(){
        var pageCounterSpan = document.getElementById("PageCounterSpan");
        var pageCounterInput = document.getElementById("PageCounterInput");
        pageCounterSpan.textContent = " / " + __TOTAL_PAGES;
        pageCounterSpan.insertBefore(pageCounterInput, pageCounterSpan.childNodes[0]);
        if (!_miniToolbar) {
            pageCounterSpan.nextSibling.style.marginLeft = (((__TOTAL_PAGES.toString() + " / ").length + 4) * 10.5) + "px";
        }
    }
    
    function _resizeDocumentToolbar(parent, groups){
        var toolbarDiv = document.getElementById("CreoViewDocumentToolbar");
        document.getElementById(_currentCanvasId).parentNode.style.height = (parseInt(parent.clientHeight) - _toolbarHeight) + "px";
        if (_sidebarEnabled){
            var sidebarDiv = document.getElementById("CreoViewDocumentSidebar");
            if (sidebarDiv) {
                sidebarDiv.style.height = parseInt(parent.clientHeight) - _toolbarHeight + "px";
                sidebarDiv.childNodes[1].style.height = parseInt(parent.clientHeight) - (_toolbarHeight*2) + "px";
            }
        }
        if (!_miniToolbar) {   
            var buttonsWidth = 0;
            var toolbarGroups = document.getElementsByClassName("CreoToolbarGroup");
            for (var i = 0; i < toolbarGroups.length; i++){
                buttonsWidth += parseInt(toolbarGroups[i].clientWidth) + 10;
            }
            _toolbarButtonsWidth = buttonsWidth + 282;
            if(parent.clientWidth <= _toolbarButtonsWidth){
                _toggleToolbarCover("block");
                _BuildDocumentToolbarMenu(toolbarDiv, groups, parent);
            }
        } else {
            if (parent.clientWidth > _toolbarButtonsWidth + 1){
                _toggleToolbarCover("block");
                _BuildDocumentToolbarContent(toolbarDiv, groups, parent);
                _updateDocumentToolbarPageDisplay();
            }
        }
        if (!_miniToolbar) {
            var midContainer = toolbarDiv.childNodes[2];
            midContainer.style.position = "absolute";
            midContainer.style.marginLeft = (parseInt(toolbarDiv.clientWidth) - (parseInt(midContainer.clientWidth) + 65))/2 + "px";
            midContainer.style.marginRight = (parseInt(toolbarDiv.clientWidth) - (parseInt(midContainer.clientWidth) + 65))/2 + "px";
            if(_toolbarGroups.pages) {
                var nextPageButton = document.getElementById("CreoToolbarPagesGroupNextPage");
                nextPageButton.style.marginLeft = (parseInt(document.getElementById("PageCounterSpan").clientWidth) + 20) + "px";
            }
        } else {
            var pageModeOptions = document.getElementById("PdfToolbarMiniMenuPageModeOptions");
            pageModeOptions.style.display = "none";
            pageModeOptions.parentNode.style.backgroundColor = "inherit";
            var midContainer = toolbarDiv.childNodes[2];
            midContainer.style.marginLeft = (parseInt(toolbarDiv.clientWidth) - 57)/2 + "px";
            var miniMenuDiv = document.getElementById("PdfToolbarMiniMenuButton").childNodes[1];
            miniMenuDiv.style.maxHeight = (parseInt(parent.clientHeight) - (_toolbarHeight + 15)) + "px";
            _toggleMenuScrollIndicator(miniMenuDiv, parent);;
        }
    }

    function _updateDocumentToolbarPageDisplay() {
        if (_toolbarEnabled && !_miniToolbar && _toolbarGroups.pages){
            document.getElementById("PageCounterInput").value = __CURRENT_PAGE;
        }
    }
    
    function _BuildDocumentToolbarMenu(toolbarDiv, groups, parent){
        _miniToolbar = true;        
        while(toolbarDiv.firstChild){
            toolbarDiv.removeChild(toolbarDiv.firstChild);
        }
        parent.removeEventListener("mousemove", function(e){
            _dragSearchBox(parent, e);
        });
        parent.removeEventListener("mouseleave", function(){
            if (_searchDrag.enabled) {
                _searchDrag.enabled = false;
            }
        });
        parent.removeEventListener("mouseup", function(){
            if (_searchDrag.enabled) {
                _searchDrag.enabled = false;
            }
        });
        
        var leftContainer = document.createElement("div");
        leftContainer.setAttribute('style',"float: left");
        var rightContainer = document.createElement("div");
        rightContainer.setAttribute('style',"float: right");
        var midContainer = document.createElement("div");
        midContainer.setAttribute('style',"margin-left: " + (parseInt(toolbarDiv.clientWidth) - 57)/2 + "px");
        toolbarDiv.appendChild(leftContainer);
        toolbarDiv.appendChild(rightContainer);
        toolbarDiv.appendChild(midContainer);
        
        var menuButton = document.createElement("span");
            menuButton.id = "PdfToolbarMiniMenuButton";
            var menuImage = document.createElement("img");
            _AddToolbarButtonLoad(menuImage);
            menuImage.src = ThingView.resourcePath + '/icons/pdf_more_menu.svg';
            menuButton.appendChild(menuImage);
            menuButton.setAttribute('style', "position: absolute; margin: 6px; padding: 6px; -webkit-user-select: none; -ms-user-select: none; -moz-user-select: none; cursor: pointer");
            var menuDiv = document.createElement("div");
            menuDiv.id = "PdfToolbarMiniMenuDiv";
            menuDiv.setAttribute('style', "display: none; background-color: #4D5055; position: absolute; z-index: 5; padding: 5px; margin-top: 12.5px; margin-left: -6px; cursor: auto; color: #FFFFFF; white-space: nowrap; max-height: " + (parseInt(parent.clientHeight) - (_toolbarHeight + 15)) + "px; overflow-y: auto; overflow-x: visible; scrollbar-width: none; -ms-overflow-style: none");
            var newStyle = "#PdfToolbarMiniMenuDiv::-webkit-scrollbar {display: none}";
            if (document.querySelector('style') && 
                document.querySelector('style').textContent.search(newStyle) == -1) {
                document.querySelector('style').textContent += newStyle;
            } else if (!document.querySelector('style')) {
                var style = document.createElement('style');
                style.textContent = newStyle;
                document.getElementsByTagName('head')[0].appendChild(style);
            }
            if (groups.sidebar) {
                _buildMiniSidebarGroup(menuDiv);
            }       
            if (groups.pages) {
                _buildMiniPagesGroup(menuDiv);
                var pagesCounter = _buildPagesCounter();
                pagesCounter.style.marginLeft = "42px";
                leftContainer.appendChild(pagesCounter);
            }
            if (groups.rotate) {
                _buildMiniRotateGroup(menuDiv);
            }
            if (groups.zoom) {
                _buildMiniZoomGroup(menuDiv);
                var zoomGroup = document.createElement("div");
                zoomGroup.setAttribute('style', "display: inline-block; white-space: nowrap");
                var zoomInButton = _BuildDocumentToolbarButton("/icons/pdf_zoom_in.svg", true);
                _AddToolbarButtonMouseOver(zoomInButton);
                zoomInButton.addEventListener("click", function(){
                    _zoomButtonScale = _zoomInScale;
                    _zoomButtonPDF();
                });
                zoomGroup.appendChild(zoomInButton);
                var zoomOutButton = _BuildDocumentToolbarButton("/icons/pdf_zoom_out.svg", true);
                _AddToolbarButtonMouseOver(zoomOutButton);
                zoomOutButton.addEventListener("click", function(){
                    _zoomButtonScale = _zoomOutScale;
                    _zoomButtonPDF();
                });
                zoomGroup.appendChild(zoomOutButton);
                midContainer.appendChild(zoomGroup);
            }            
            if (groups.cursor) {
                _buildMiniCursorGroup(menuDiv);
            }
            if (groups.print && _printEnabled) {
                _buildMiniPrintGroup(parent, menuDiv);
            }
            
            menuDiv.addEventListener("scroll", function(){
                _toggleMenuScrollIndicator(menuDiv);
            });
            
            menuButton.appendChild(menuDiv);
            menuButton.addEventListener("click", function(){
                if(menuDiv.style.display == "none"){
                    menuDiv.style.display = "block";
                    menuButton.style.backgroundColor = "#232B2D";
                    _toggleMenuScrollIndicator(menuDiv, parent);
                } else {
                    menuDiv.style.display = "none";
                    menuButton.style.backgroundColor = "inherit";
                }
            });
            menuButton.addEventListener("mouseenter", function(){
                if (menuDiv.style.display == "none") {
                    menuButton.style.backgroundColor = "#232B2D";
                }
            });
            menuButton.addEventListener("mouseleave", function(){
                if (menuDiv.style.display == "none") {
                    menuButton.style.backgroundColor = "inherit";
                }
            });
        
        if (groups.search) {
            var searchButton = _BuildDocumentSearchToolbar(parent);
            rightContainer.appendChild(searchButton);
        }        
        leftContainer.appendChild(menuButton);
    }
    
    function _buildMenuHr () {
        var hr = document.createElement("hr");
        hr.setAttribute('style', "margin-top: 4px; margin-bottom: 4px; color: #44474B; border-style: solid");
        return hr;
    }
    
    function _buildMiniPagesGroup (menuDiv) {
        var firstPageDiv = _createMiniMenuItem("First Page", "/icons/pdf_first_page.svg");
        firstPageDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _LoadPage(_pdfCallback, 1);
        });
        _AddMiniToolbarEvents(firstPageDiv);
        menuDiv.appendChild(firstPageDiv);
        
        var prevPageDiv = _createMiniMenuItem("Previous Page", "/icons/pdf_previous_page.svg");
        prevPageDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _LoadPrevPage(_pdfCallback);
        });
        _AddMiniToolbarEvents(prevPageDiv);
        menuDiv.appendChild(prevPageDiv);
        
        var nextPageDiv = _createMiniMenuItem("Next Page", "/icons/pdf_next_page.svg");
        nextPageDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _LoadNextPage(_pdfCallback);
        });
        _AddMiniToolbarEvents(nextPageDiv);
        menuDiv.appendChild(nextPageDiv);
        
        var lastPageDiv = _createMiniMenuItem("Last Page", "/icons/pdf_last_page.svg");
        lastPageDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _LoadPage(_pdfCallback, __TOTAL_PAGES);
        });
        _AddMiniToolbarEvents(lastPageDiv);
        menuDiv.appendChild(lastPageDiv);
        
        menuDiv.appendChild(_buildMenuHr());
    }
    
    function _buildMiniRotateGroup (menuDiv) {
        var rotateClockwiseDiv = _createMiniMenuItem("Rotate Clockwise", "/icons/pdf_rotate_clockwise.svg");
        rotateClockwiseDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _RotateDocumentPages(true);
        });
        _AddMiniToolbarEvents(rotateClockwiseDiv);
        menuDiv.appendChild(rotateClockwiseDiv);
        
        var rotateAntiClockwiseDiv = _createMiniMenuItem("Rotate Anti-clockwise", "/icons/pdf_rotate_anti_clockwise.svg");
        rotateAntiClockwiseDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _RotateDocumentPages(false);
        });
        _AddMiniToolbarEvents(rotateAntiClockwiseDiv);
        menuDiv.appendChild(rotateAntiClockwiseDiv);
        _bookmarks.length > 0
        menuDiv.appendChild(_buildMenuHr());
    }
    
    function _buildMiniZoomGroup (menuDiv) {
        var zoomInDiv = _createMiniMenuItem("Zoom In", "/icons/pdf_zoom_in.svg");
        zoomInDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _zoomButtonScale = _zoomInScale;
            _zoomButtonPDF();
        });
        _AddMiniToolbarEvents(zoomInDiv);
        menuDiv.appendChild(zoomInDiv); 
        
        var zoomOutDiv = _createMiniMenuItem("Zoom Out", "/icons/pdf_zoom_out.svg");
        zoomOutDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _zoomButtonScale = _zoomOutScale;
            _zoomButtonPDF();
        });
        _AddMiniToolbarEvents(zoomOutDiv);
        menuDiv.appendChild(zoomOutDiv);
        
        menuDiv.appendChild(_buildMenuHr());
        
        var pageModeOptionsDiv = document.createElement("div");
        pageModeOptionsDiv.id = "PdfToolbarMiniMenuPageModeOptions";
        pageModeOptionsDiv.setAttribute('style', "display: none; position: fixed; background-color: #4D5055; padding: 2px auto; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none");
        var newStyle = "#PdfToolbarMiniMenuPageModeOptions::-webkit-scrollbar {display: none}";
        if (document.querySelector('style') && 
            document.querySelector('style').textContent.search(newStyle) == -1) {
            document.querySelector('style').textContent += newStyle;
        } else if (!document.querySelector('style')) {
            var style = document.createElement('style');
            style.textContent = newStyle;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        var pageModeButton = _createMiniMenuItem("Page Mode", null);
        var pageModeArrow = document.createElement("img");
        pageModeArrow.src = ThingView.resourcePath + "/icons/pdf_next_find.svg";
        pageModeArrow.setAttribute('style', "transform: rotate(90deg); float: right; overflow: visible");
        pageModeButton.appendChild(pageModeArrow);
        pageModeButton.addEventListener("click", function(e){
            e.stopPropagation();
            if (pageModeOptionsDiv.style.display == "none") {
                pageModeOptionsDiv.style.left = (parseInt(pageModeButton.getBoundingClientRect().right) + 5) + "px";
                pageModeOptionsDiv.style.top = (parseInt(pageModeButton.getBoundingClientRect().top) + 1) + "px";
                pageModeOptionsDiv.style.maxHeight = (menuDiv.clientHeight - (pageModeButton.getBoundingClientRect().top - menuDiv.getBoundingClientRect().top) - 1) + "px";
                pageModeOptionsDiv.style.display = "block";
                pageModeButton.style.backgroundColor = "#232B2D";
            } else {
                pageModeOptionsDiv.style.display = "none";
                pageModeButton.style.backgroundColor = "inherit";
            }
        });
        pageModeButton.addEventListener("mouseenter", function(){
            if (pageModeOptionsDiv.style.display == "none") {
                pageModeButton.style.backgroundColor = "#232B2D";
            }
        });
        pageModeButton.addEventListener("mouseleave", function(){
            if (pageModeOptionsDiv.style.display == "none") {
                pageModeButton.style.backgroundColor = "inherit";
            }
        });
        pageModeButton.appendChild(pageModeOptionsDiv);
        menuDiv.appendChild(pageModeButton);
        
        var pageModeTexts = ["Original", "Fit Page", "Fit Width", "500%", "250%", "200%", "100%", "75%", "50%"];
        for (var i = 0; i < pageModeTexts.length; i++) {
            var optionDiv = document.createElement("div");
            optionDiv.setAttribute('style', "white-space: nowrap; padding: 2px 5px");
            optionDiv.textContent = pageModeTexts[i];
            optionDiv.addEventListener("click", function(e){
                e.stopPropagation();
                var processedPageMode = e.target.innerHTML.replace(" ", "").replace("%", "percent");
                _pageMode = processedPageMode;
                _setPageModePDF();
                for (var j = 0; j < e.target.parentNode.childNodes.length; j++) {
                    e.target.parentNode.childNodes[j].style.backgroundColor = "inherit";
                }
                e.target.style.backgroundColor = "#232B2D";
            });
            optionDiv.addEventListener("mouseenter", function(e){
                e.target.style.backgroundColor = "#232B2D";
            });
            optionDiv.addEventListener("mouseleave", function(e){
                var processedPageMode = e.target.innerHTML.replace(" ", "").replace("%", "percent");
                if (_pageMode != processedPageMode) {
                    e.target.style.backgroundColor = "inherit";
                }
            });
            pageModeOptionsDiv.appendChild(optionDiv);
        }
        menuDiv.appendChild(_buildMenuHr());
    }
    
    function _buildMiniCursorGroup (menuDiv) {
        var panModeButton = _createMiniMenuItem("Pan Mode", "/icons/pdf_pan_view.svg");
        menuDiv.appendChild(panModeButton);
        var textModeButton = _createMiniMenuItem("Text Select Mode", "/icons/pdf_text_select.svg");
        menuDiv.appendChild(textModeButton);        
        if (_cursorMode == "pan") {
            panModeButton.style.backgroundColor = "#232B2D";
        } else if (_cursorMode == "text") {
            textModeButton.style.backgroundColor = "#232B2D";
        }
        
        panModeButton.addEventListener("click", function(e){
            e.stopPropagation();
            if (_zoomButton) {
                _setZoomOnButton(_zoomButtonScale);
            }
            _cursorMode = "pan";
            _setUserSelect();
            panModeButton.style.backgroundColor = "#232B2D";
            textModeButton.style.backgroundColor = "inherit";
        });
        textModeButton.addEventListener("click", function(e){
            e.stopPropagation();
            if (_zoomButton) {
                _setZoomOnButton(_zoomButtonScale);
            }
            _cursorMode = "text";
            _setUserSelect();
            textModeButton.style.backgroundColor = "#232B2D";
            panModeButton.style.backgroundColor = "inherit";
        });
        
        panModeButton.addEventListener("mouseenter", function(){
            if (_cursorMode != "pan") {
                panModeButton.style.backgroundColor = "#232B2D";
            }
        });
        panModeButton.addEventListener("mouseleave", function(){
            if (_cursorMode != "pan") {
                panModeButton.style.backgroundColor = "inherit";
            }
        });
        textModeButton.addEventListener("mouseenter", function(){
            if (_cursorMode != "text") {
                textModeButton.style.backgroundColor = "#232B2D";
            }
        });
        textModeButton.addEventListener("mouseleave", function(){
            if (_cursorMode != "text") {
                textModeButton.style.backgroundColor = "inherit";
            }
        });
        
        menuDiv.appendChild(_buildMenuHr());
    }
    
    function _buildMiniSidebarGroup (menuDiv) {
        var sidebarToggleDiv = _createMiniMenuItem("Display Sidebar", "/icons/pdf_sidebar.svg");
        if (_sidebarEnabled){
            sidebarToggleDiv.style.backgroundColor = "#232B2D";
        }
        sidebarToggleDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _togglePdfSidePane();
            if (_sidebarEnabled){
                sidebarToggleDiv.style.backgroundColor = "#232B2D";
            } else {
                sidebarToggleDiv.style.backgroundColor = "inherit";
            }
        });
        sidebarToggleDiv.addEventListener("mouseenter", function(){
            if(!_sidebarEnabled){
                sidebarToggleDiv.style.backgroundColor = "#232B2D";
            }
        });
        sidebarToggleDiv.addEventListener("mouseleave", function(){
            if(!_sidebarEnabled){
                sidebarToggleDiv.style.backgroundColor = "inherit";
            }
        });
        menuDiv.appendChild(sidebarToggleDiv);
        menuDiv.appendChild(_buildMenuHr());
    }
    
    function _buildMiniPrintGroup (parent, menuDiv) {
        var printDiv = _createMiniMenuItem("Print PDF", "/icons/pdf_print.svg");
        _AddMiniToolbarEvents(printDiv);
        printDiv.addEventListener("click", function(e){
            e.stopPropagation();
            _PrintPdf(parent);
        });
        menuDiv.appendChild(printDiv);
    }
    
    function _createMiniMenuItem (text, imgURL) {
        var item = document.createElement("div");
        item.setAttribute('style', "background-color: #4D5055; color: #FFFFFF; cursor: pointer; height: 23px; padding-right: 10px; padding-top: 7px");
        item.textContent = text;
        if (imgURL) {
            var itemIcon = document.createElement("img");
            itemIcon.src = ThingView.resourcePath + imgURL;
            itemIcon.setAttribute('style', "margin: 0px 18px 0px 12px");
            item.insertBefore(itemIcon, item.childNodes[0]);
        } else {
            item.style.paddingLeft = "46px";
        }
        return item;
    }
    
    function _AddMiniToolbarEvents (button) {
        button.addEventListener("mouseenter", function(){
            button.style.backgroundColor = "#232B2D";
        });
        button.addEventListener("mouseleave", function(){
            button.style.backgroundColor = "inherit";
        });
    }
    
    function _setDocumentMenuUnderline (target) {
        if (_toolbarEnabled && _miniToolbar) {
            var options = target.parentNode.childNodes;
            for (var i = 0; i < options.length; i++) {
                options[i].style.textDecoration = "none";
            }
            target.style.textDecoration = "underline";
        }
    }
    
    function _BuildDocumentSearchToolbar (parent) {
        var searchButton = document.createElement("div");
            searchButton.id = "CreoToolbarSearchGroup";
            searchButton.setAttribute('style', "display: inline-block; margin: 6px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none");
            var searchIcon = document.createElement("img");
            _AddToolbarButtonLoad(searchIcon);
            searchIcon.alt = 'Search...';
            searchIcon.src = ThingView.resourcePath + '/icons/pdf_find.svg';
            searchButton.style.padding = "5px";
            searchButton.appendChild(searchIcon);
            searchButton.style.cursor = "pointer";
            
            var searchGroup = document.createElement("div");
            searchGroup.setAttribute('style', "display: none; color: #FFFFFF; background-color: #44474B; position: absolute; z-index: 3; padding: 0px 5px 5px; margin-top: 7.5px; top: 80px; right: 30px; cursor: move");
            searchGroup.id = "PdfToolbarSearchBox";
            _searchDrag.y = 80;
            _searchDrag.x = _toolbarHeight;
            
            var searchTextWrapper = document.createElement("span");
            searchTextWrapper.setAttribute('style', "margin-right: 2px; margin-top: 5px; display: inline-block; vertical-align: middle");
            
            var searchTextBox = document.createElement("input");
            searchTextBox.id = "PdfToolbarSearchTextBox";
            searchTextBox.type = "text";
            searchTextBox.setAttribute('style', "cursor: auto");
            searchTextBox.addEventListener("click", function(e){
                e.stopPropagation();
            });
            searchTextBox.addEventListener("mousedown", function(e){
                e.stopPropagation();
            });
            searchTextBox.addEventListener("keydown", function(e){
                if (e.key == "Enter") {
                    if (_searchTerm != searchTextBox.value) {
                        _SearchInPdfDocument(searchTextBox.value);
                    } else {
                        if (_searchState) {
                            _searchState.highlightAll = false;
                            _searchState.findPrevious = false;
                            _nextMatch();
                        }
                    }
                }
            });
            searchTextWrapper.appendChild(searchTextBox);
            searchGroup.appendChild(searchTextWrapper);
            
            var searchQueryButton =_BuildDocumentToolbarButton('/icons/pdf_find.svg', false);
            searchQueryButton.style.verticalAlign = "middle";
            searchQueryButton.title = "Search";
            _AddToolbarButtonMouseOver(searchQueryButton);
            searchQueryButton.addEventListener("click", function(e){
                e.stopPropagation();
                _SearchInPdfDocument(searchTextBox.value);
            });
            searchGroup.appendChild(searchQueryButton);
            
            var searchClearButton = _BuildDocumentToolbarButton('/icons/pdf_clear.svg', false);
            searchClearButton.style.backgroundColor = "transparent";
            searchClearButton.style.verticalAlign = "middle";
            searchClearButton.style.position = "absolute";
            searchClearButton.style.float = "right";
            searchClearButton.style.margin = "-1px 0px auto -20px";
            searchClearButton.title = "Clear";
            searchClearButton.addEventListener("click", function(e){
                e.stopPropagation();
                _searchTerm = "";
                searchTextBox.value = "";
                _removePdfSearchResultHighlights ();
                _DisplayPdfSearchResultsDialogue(_searchStatusMessage.enterTerm);
            });
            searchTextWrapper.appendChild(searchClearButton);
            
            var searchNextButton = _BuildDocumentToolbarButton('/icons/pdf_previous_find.svg', false);
            searchNextButton.style.verticalAlign = "middle";
            searchNextButton.title = "Next";
            _AddToolbarButtonMouseOver(searchNextButton);
            searchNextButton.addEventListener("click", function(e){
                e.stopPropagation();
                if (_searchState) {
                    _searchState.highlightAll = false;
                    _searchState.findPrevious = false;
                    _nextMatch();
                }
            });
            searchGroup.appendChild(searchNextButton);
            
            var searchPrevButton = _BuildDocumentToolbarButton('/icons/pdf_next_find.svg', false);
            searchPrevButton.style.verticalAlign = "middle";
            searchPrevButton.title = "Previous";
            _AddToolbarButtonMouseOver(searchPrevButton);
            searchPrevButton.addEventListener("click", function(e){
                e.stopPropagation();
                if (_searchState) {
                    _searchState.highlightAll = false;
                    _searchState.findPrevious = true;
                    _nextMatch();
                }
            });
            searchGroup.appendChild(searchPrevButton);
            
            var searchCloseButton = _BuildDocumentToolbarButton('/icons/pdf_close.svg', false);
            searchCloseButton.style.margin = "0px 0px -20px 12px";
            searchCloseButton.style.padding = "0px";
            searchCloseButton.title = "Close";
            _AddToolbarButtonMouseOver(searchCloseButton);
            searchCloseButton.addEventListener("click", function(e){
                e.stopPropagation();
                searchGroup.style.display = "none";
                searchButton.style.backgroundColor = "inherit";
                searchButton.style.color = "inherit";
                _searchTerm = "";
                _removePdfSearchResultHighlights ();
            });
            searchGroup.appendChild(searchCloseButton);
            
            var searchResultsDiv = document.createElement("div");
            searchResultsDiv.id = "PdfToolbarSearchResultsDiv";
            searchResultsDiv.setAttribute('style', "text-align: center; margin-top: 1px");
            searchResultsDiv.textContent = _searchStatusMessage.enterTerm;
            searchGroup.appendChild(searchResultsDiv);
            
            searchButton.appendChild(searchGroup);
            
            searchButton.addEventListener("click", function(e){
                e.stopPropagation();
                _toggleSearchBox();
            });
            searchGroup.addEventListener("click", function(e){
                e.stopPropagation();
            });
            searchGroup.addEventListener("mousedown", function(e){
                if (!_searchDrag.enabled) {
                    _searchDrag.enabled = true;
                    _searchDrag.x = e.clientX;
                    _searchDrag.y = e.clientY;
                }
            });
            parent.addEventListener("mousemove", function(e){
                _dragSearchBox(parent, e);
            });
            parent.addEventListener("mouseleave", function(){
                if (_searchDrag.enabled) {
                    _searchDrag.enabled = false;
                }
            });
            parent.addEventListener("mouseup", function(){
                if (_searchDrag.enabled) {
                    _searchDrag.enabled = false;
                }
            });
            searchButton.addEventListener("mouseenter", function(){
                if (searchGroup.style.display == "none") {
                    searchButton.style.backgroundColor = "#232B2D";
                }
            });
            searchButton.addEventListener("mouseleave", function(){
                if (searchGroup.style.display == "none") {
                    searchButton.style.backgroundColor = "inherit";
                }
            });
            
        return searchButton;
    }
    
    function _toggleSearchBox () {
        if (!_IsPDFSession() || !_toolbarEnabled || !_toolbarGroups.search) {
            return;
        }
        _searchDrag.enabled = false;
        var searchGroup = document.getElementById("PdfToolbarSearchBox");
        var searchButton = document.getElementById("CreoToolbarSearchGroup");
        if(searchGroup.style.display == "none"){
            searchGroup.style.display = "block";
            document.getElementById("PdfToolbarSearchTextBox").value = "";
            _DisplayPdfSearchResultsDialogue(_searchStatusMessage.enterTerm);
            searchButton.style.backgroundColor = "#232B2D";
            searchButton.style.color = "#000000";
        } else {
            searchGroup.style.display = "none";
            searchButton.style.backgroundColor = "inherit";
            searchButton.style.color = "inherit";
        }
    }
    
    function _dragSearchBox (parent, e) {
        if (_searchDrag.enabled) {
            var parentRect = parent.getBoundingClientRect();
            var searchBox = document.getElementById("PdfToolbarSearchBox");
            var searchRect = searchBox.getBoundingClientRect();
            if (!(parentRect.left > searchRect.left - (_searchDrag.x - e.clientX)
                || parentRect.right - 20 < searchRect.right - (_searchDrag.x - e.clientX)
                || parentRect.top + 35 > searchRect.top - (_searchDrag.y - e.clientY)
                || parentRect.bottom - 20 < searchRect.bottom - (_searchDrag.y - e.clientY))) {
                    searchBox.style.right = (parseInt(searchBox.style.right) + (_searchDrag.x - e.clientX)) + "px";
                    searchBox.style.top = (parseInt(searchBox.style.top) - (_searchDrag.y - e.clientY)) + "px";
            }
            _searchDrag.x = e.clientX;
            _searchDrag.y = e.clientY;
        }
    }
    
    function _toggleMenuScrollIndicator (menuDiv, parent) {
        if (!document.getElementById("PdfToolbarMiniMenuScrollIndicator") && !(menuDiv.scrollTop == (menuDiv.scrollHeight - menuDiv.offsetHeight))) {
            var scrollIndicator = document.createElement("div");
            scrollIndicator.id = "PdfToolbarMiniMenuScrollIndicator";
            scrollIndicator.setAttribute('style', "background-color: #4D5055; box-shadow: 0px -7px 6px 0px #4D5055; width: " + (parseInt(menuDiv.clientWidth) - 10) + "px; height: 20px; position: fixed; bottom: " + (window.innerHeight - parseInt(menuDiv.getBoundingClientRect().bottom)) + "px; left: " + (parseInt(menuDiv.getBoundingClientRect().left) + 5) + "px");
            var scrollArrow = document.createElement("img");
            scrollArrow.src = ThingView.resourcePath + "icons/pdf_previous_find.svg";
            scrollArrow.setAttribute('style',"left: " + (parseInt(scrollIndicator.style.width)/2 - 8) + "px; top: 2px; position: absolute");
            scrollIndicator.appendChild(scrollArrow);
            menuDiv.appendChild(scrollIndicator);
        } else if (document.getElementById("PdfToolbarMiniMenuScrollIndicator") && (menuDiv.scrollTop == (menuDiv.scrollHeight - menuDiv.offsetHeight))){
            menuDiv.removeChild(document.getElementById("PdfToolbarMiniMenuScrollIndicator"));
        }
    }
    
    function _buildToolbarCover (parent) {
        var toolbarCover = document.createElement('div');
        toolbarCover.id = "PdfToolbarCover";
        toolbarCover.setAttribute('style', "display: block; z-index: 4; background-color: #44474B; width:" + parseInt(parent.clientWidth) + "px; height: " + _toolbarHeight + "px; position: fixed; top: " + (parseInt(parent.getBoundingClientRect().top) + 2) + "px");
        parent.appendChild(toolbarCover);
    }
    
    function _toggleToolbarCover (state) {
        if (!state) {
            return;
        }
        if (state == "none") {
            _toolbarGroupsLoaded.current += 1;
            if (_toolbarGroupsLoaded.targetFull == 0 || 
               (!_miniToolbar && _toolbarGroupsLoaded.current == _toolbarGroupsLoaded.targetFull) ||
               (_miniToolbar && _toolbarGroupsLoaded.current == _toolbarGroupsLoaded.targetMini)) {
                    document.getElementById("PdfToolbarCover").style.display = state;
            }
        } else if (state == "block"){
            _toolbarGroupsLoaded.current = 0;
             document.getElementById("PdfToolbarCover").style.display = state;
        }
    }
    
    //PDF BOOKMARKS
    
    function _ShowPdfBookmark (bookmarkTitle) {
        var bookmarkData = _GetPdfBookmark(bookmarkTitle, _bookmarks);
        if(!bookmarkData){
            return;
        }
        __PDF_DOC.getDestination(bookmarkData.dest).then(function(val){
            var destination = val ? val : bookmarkData.dest;
            __PDF_DOC.getPageIndex(destination[0]).then(function(pageIndex){
                if(destination[1].name == "FitB") {
                    _pageMode = "FitPage";
                    _setPageModeFitPage(function() {
                        _LoadPage(function(success){
                            if (_pdfCallback) {
                                _pdfCallback(success);
                            }
                        }, pageIndex+1);
                    });
                } else {
                    if (destination[1].name == "XYZ" && !_checkPageRotation()) {
                        gotoBookmark(pageIndex+1, destination, function(success) {
                            if (_pdfCallback) {
                                _pdfCallback(success);
                            }
                        });
                    } else {
                        _LoadPage(function(success){
                            if (_pdfCallback) {
                                _pdfCallback(success);
                            }
                        }, pageIndex+1);
                    }
                }
            });
        });
    }

    function _setPageModeFitPage(callback) {
        var canvasWrapper = document.getElementById(_currentCanvasId);
        var scale = (canvasWrapper.parentNode.clientHeight - _marginSize * 2) / _getLargestPageHeight() * __ZOOMSCALE;
        if (Math.abs(__ZOOMSCALE - scale) > 0.001) {
            __ZOOMSCALE = scale;

            _refreshPDF(function(success){
                if (success) {
                    callback();
                }
            }, {zoomScale: __ZOOMSCALE});
        } else {
            callback();
        }

        _updateToolbarPageModeSelection();
    }
    
    function _GetPdfBookmark(bookmarkTitle, bookmarkList) {
        var returnBookmark = null;
        for(var i = 0; i < bookmarkList.length; i++) {
            if (bookmarkList[i].title == bookmarkTitle) {
                returnBookmark = bookmarkList[i];
            } else if (bookmarkList[i].items.length > 0){
                returnBookmark = _GetPdfBookmark(bookmarkTitle, bookmarkList[i].items);
            }
            if (returnBookmark){
                break;
            }
        }
        return returnBookmark;
    }
    
    //PDF SEARCH

    function _resetSearchVariables() {
        _extractTextPromises = [];
        _pageMatches = [];
        _pageContents = [];
        _matchesCountTotal = 0;
        _indexedPageNum = 0;
        clearTimeout(_findTimeout);
        _findTimeout = null;
        _pendingFindMatches = Object.create(null);
        _scrollMatches = false;
        _searchState = null;
        _dirtyMatch = false;
        _selected = {
            pageIdx: -1,
            matchIdx: -1
        };
        _offset = {
            pageIdx: null,
            matchIdx: null,
            wrapped: false
        };
        _resumePageIdx = null;
        _matchSelected = {
            pageIdx:  -1,
            matchIdx: -1
        };
        _pagesToSearch = null;
    }
    
    function _SearchInPdfDocument(searchTerm, findDirection, callback) {
        if(searchTerm == ""){
            return;
        }

        if (callback) {
            if (_searchTerm == searchTerm &&
                _searchResultsCase == _searchCaseMatch &&
                _searchResultsWord == _searchWordMatch) {
                callback(true); // duplicated search
                return;
            }
        }

        _removePdfSearchResultHighlights();
        _searchTerm = searchTerm;
        _searchResultsCase = _searchCaseMatch;
        _searchResultsWord = _searchWordMatch;

        _DisplayPdfSearchResultsDialogue(_searchStatusMessage.searching);

        _searchState = {
            query: _searchTerm,
            phraseSearch: true,
            caseSensitive: _searchCaseMatch,
            entireWord: _searchWordMatch,
            highlightAll: (findDirection == 0),
            findPrevious: (findDirection == -1)
        };
        _dirtyMatch = true;

        _buildSearchResult(function() {
            if (callback) {
                callback(false); // new search
            }
        });
    }

    function _updateUIResultsCount() {
        if (!_toolbarEnabled) return;

        var total = _matchesCountTotal;
        var pageIdx = _selected.pageIdx;
        var matchIdx = _selected.matchIdx;
        var current = 0;
        if (matchIdx !== -1) {
            for (var i = 0; i < pageIdx; i++) {
                current += _pageMatches[i] && _pageMatches[i].length || 0;
            }

            current += matchIdx + 1;
        }

        if (current < 1 || current > total) {
            current = total = 0;
        }

        var message = "";
        if (_indexedPageNum != __TOTAL_PAGES) {
            message = "Searching page " + _indexedPageNum;
        } else {
            if (total == 0) {
                message = _searchStatusMessage.notFound;
            } else {
                message = current + " of " + total + " match" + (total != 1 ? "es" : "");
            }
        }
        _DisplayPdfSearchResultsDialogue(message);
    }

    function _createPromise() {
        var capability = {};
        capability.promise = new Promise(function (resolve, reject) {
            capability.resolve = resolve;
            capability.reject = reject;
        });
        return capability;
    }

    function _extractText() {
        if (_extractTextPromises.length > 0) {
            return;
        }
    
        var promise = Promise.resolve();
    
        var _loop = function _loop(pageNo) {
            var extractTextCapability = _createPromise();
            _extractTextPromises[pageNo] = extractTextCapability.promise;
            promise = promise.then(function () {
                return __PDF_DOC.getPage(pageNo).then(function (pdfPage) {
                    return pdfPage.getTextContent({
                        normalizeWhitespace: true
                    });
                }).then(function (textContent) {
                    var textItems = textContent.items;
                    var strBuf = [];

                    for (var j = 0, jj = textItems.length; j < jj; j++) {
                        strBuf.push(textItems[j].str);
                    }

                    _pageContents[pageNo] = normalize(strBuf.join(''));
                    extractTextCapability.resolve(pageNo);
                }, function (reason) {
                    console.error("Unable to get text content for page ".concat(pageNo), reason);
                    _pageContents[pageNo] = '';
                    extractTextCapability.resolve(pageNo);
                });
            });
        };

        var curPage = _searchState.highlightAll ? _firstLoadedPage : __CURRENT_PAGE;
        var count = 0;
        while (count != __TOTAL_PAGES) {
            _loop(curPage);
            curPage = _getNextPageNo(curPage, !_searchState.findPrevious);
            count += 1;
        }
    }

    function _getNextPageNo(pageNo, next) {
        if (next) {
            var nextPageNo = pageNo + 1;
            if (nextPageNo > __TOTAL_PAGES) {
                return 1;
            } else {
                return nextPageNo;
            }
        } else {
            var prevPageNo = pageNo - 1;
            if (prevPageNo < 1) {
                return __TOTAL_PAGES;
            } else {
                return prevPageNo;
            }
        }
    }

    function _calculatePageMatch(pageNo) {
        var pageContent = _pageContents[pageNo];
        var query = _searchTerm;

        if (!_searchCaseMatch) {
            pageContent = pageContent.toLowerCase();
            query = query.toLowerCase();
        }
  
        _calculatePhraseMatch(query, pageNo, pageContent, _searchWordMatch);
  
        if (_resumePageIdx === pageNo) {
            _resumePageIdx = null;
  
            _nextPageMatch();
        }

        var pageMatchesCount = _pageMatches[pageNo].length;

        if (pageMatchesCount > 0) {
            _matchesCountTotal += pageMatchesCount;
        }
        _indexedPageNum += 1;
        _updateUIResultsCount();
    }

    function _calculatePhraseMatch(query, pageIndex, pageContent, entireWord) {
        var matches = [];
        var queryLen = query.length;
        var matchIdx = -queryLen;
  
        while (true) {
            matchIdx = pageContent.indexOf(query, matchIdx + queryLen);
    
            if (matchIdx === -1) {
                break;
            }
    
            if (entireWord && !_isEntireWord(pageContent, matchIdx, queryLen)) {
                continue;
            }
    
            matches.push(matchIdx);
        }
  
        _pageMatches[pageIndex] = matches;
    }

    function _nextMatch() {
        var previous = _searchState.findPrevious;
        var numPages = __TOTAL_PAGES;

        if (_dirtyMatch) {
            _dirtyMatch = false;
            _selected.pageIdx = _selected.matchIdx = -1;
            _offset.pageIdx = __CURRENT_PAGE;
            _offset.matchIdx = null;
            _offset.wrapped = false;
            _resumePageIdx = null;
            _pageMatches.length = 0;
            _matchesCountTotal = 0;
            _indexedPageNum = 0;

            var _calLoop = function _calLoop(curPage) {
                if (_pendingFindMatches[curPage] == true) {
                    return;
                }

                _pendingFindMatches[curPage] = true;

                _extractTextPromises[curPage].then(function(pageNo) {
                    delete _pendingFindMatches[pageNo];

                    _calculatePageMatch(pageNo);
                });
            };

            var curPage = _searchState.highlightAll ? _firstLoadedPage : __CURRENT_PAGE;
            var count = 0;
            while (count != __TOTAL_PAGES) {
                _calLoop(curPage);
                curPage = _getNextPageNo(curPage, !_searchState.findPrevious);
                count += 1;
            }
        }

        if (_resumePageIdx) {
            return;
        }

        var offset = _offset;
        _pagesToSearch = numPages;

        if (offset.matchIdx !== null) {
            var numPageMatches = _pageMatches[offset.pageIdx].length;

            if (!previous && offset.matchIdx + 1 < numPageMatches || previous && offset.matchIdx > 0) {
                offset.matchIdx = previous ? offset.matchIdx - 1 : offset.matchIdx + 1;

                _updateMatch(true);
                return;
            }

            _advanceOffsetPage(previous);
        }

        _nextPageMatch();
    }

    function _advanceOffsetPage(previous) {
        var offset = _offset;
        offset.pageIdx = previous ? offset.pageIdx - 1 : offset.pageIdx + 1;
        offset.matchIdx = null;
        _pagesToSearch--;
  
        if (offset.pageIdx > __TOTAL_PAGES || offset.pageIdx < 1) {
            offset.pageIdx = previous ? __TOTAL_PAGES : 1;
            offset.wrapped = true;
        }
    }

    function _nextPageMatch() {
        if (_resumePageIdx !== null) {
            console.error('There can only be one pending page.');
        }
  
        var matches = null;
  
        do {
            var pageIdx = _offset.pageIdx;
            matches = _pageMatches[pageIdx];
    
            if (!matches) {
                _resumePageIdx = pageIdx;
                break;
            }
        } while (!_matchesReady(matches));
    }

    function _matchesReady(matches) {
        var offset = _offset;
        var numMatches = matches.length;
        var previous = _searchState.findPrevious;
  
        if (numMatches) {
            offset.matchIdx = previous ? numMatches - 1 : 0;
    
            _updateMatch(true);
    
            return true;
        }
  
        _advanceOffsetPage(previous);
  
        if (offset.wrapped) {
            offset.matchIdx = null;
    
            if (_pagesToSearch < 0) {
                _updateMatch(false);
    
                return true;
            }
        }
  
        return false;
    }

    function _updateMatch() {
        var found = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        _offset.wrapped = false;
  
        if (found) {
            var previousPage = _selected.pageIdx;
            _selected.pageIdx = _offset.pageIdx;
            _selected.matchIdx = _offset.matchIdx;
    
            if (previousPage !== -1 && previousPage !== _selected.pageIdx) {
                _updatePage(previousPage);
            }
        }
  
        if (_selected.pageIdx !== -1) {
            _scrollMatches = true;
    
            _updatePage(_selected.pageIdx);
        }
    }

    function _updatePage(index) {
        if (_scrollMatches && _selected.pageIdx === index) {
            var pageMatches = _pageMatches[index] || null;
            _convertMatches(pageMatches, index, function(matches) {
                if (matches && matches.length) {
                    _focusMatch(matches, function(success) {
                        if (success) {
                            _updateUIResultsCount();
                            _matchSelected = {
                                pageIdx:  _selected.pageIdx,
                                matchIdx: _selected.matchIdx
                            };
                        }
                    });
                }
            });
        }
    }

    function _focusMatch(matches, callback) {
        _ignoreScrollEvent = true;
        showPage(_selected.pageIdx, function() {
            var match = matches[_selected.matchIdx];
            if (match) {
                _removePdfSearchResultHighlights();
                var textElement = _highlightTextElements(match);
                var destination = null;
                if (textElement) {
                    destination = {
                        1: "",
                        2:  parseFloat(textElement.style.left) + _getHorizontalOffset(textElement, match.begin.offset, 0, true)
                          + parseFloat(textElement.dataset.width) + _marginSize,
                        3: parseFloat(textElement.style.top) + parseFloat(textElement.clientHeight) / 2 + _marginSize
                    };
                }

                _scrollToPage(_selected.pageIdx, function(success) {
                    showPage(_selected.pageIdx, function() {
                        _ignoreScrollEvent = false;
                        _changePageOnScroll();
                        _updateNavbar();
                        if (callback) {
                            callback(true);
                        }
                        if (_pdfCallback) {
                            _pdfCallback(success);
                        }
                    }, 3);
                }, destination);
            }
        }, 2);
    }

    function _buildSearchResult(callback) {
        _extractText();

        if (_findTimeout) {
            clearTimeout(_findTimeout);
            _findTimeout = null;
        }

        _findTimeout = setTimeout(function () {
            _nextMatch();

            _findTimeout = null;

            if (callback) {
                callback();
            }
        }, 250);
    }

    function _isEntireWord(content, startIdx, length) {
        if (startIdx > 0) {
            var first = content.charCodeAt(startIdx);
            var limit = content.charCodeAt(startIdx - 1);
    
            if (_getCharacterType(first) == _getCharacterType(limit)) {
                return false;
            }
        }

        var endIdx = startIdx + length - 1;

        if (endIdx < content.length - 1) {
            var last = content.charCodeAt(endIdx);

            var _limit = content.charCodeAt(endIdx + 1);

            if (_getCharacterType(last) == _getCharacterType(_limit)) {
                return false;
            }
        }
    
        return true;
    }

    function _getCharacterType (charCode) {
        var CharacterType = {
            SPACE: 0,
            ALPHA_LETTER: 1,
            PUNCT: 2,
            HAN_LETTER: 3,
            KATAKANA_LETTER: 4,
            HIRAGANA_LETTER: 5,
            HALFWIDTH_KATAKANA_LETTER: 6,
            THAI_LETTER: 7
        };

        function isAlphabeticalScript(charCode) {
            return charCode < 0x2E80;
        }

        function isAscii(charCode) {
            return (charCode & 0xFF80) === 0;
        }

        function isAsciiAlpha(charCode) {
            return charCode >= 0x61 && charCode <= 0x7A || charCode >= 0x41 && charCode <= 0x5A;
        }

        function isAsciiDigit(charCode) {
            return charCode >= 0x30 && charCode <= 0x39;
        }

        function isAsciiSpace(charCode) {
            return charCode === 0x20 || charCode === 0x09 || charCode === 0x0D || charCode === 0x0A;
        }

        function isHan(charCode) {
            return charCode >= 0x3400 && charCode <= 0x9FFF || charCode >= 0xF900 && charCode <= 0xFAFF;
        }

        function isKatakana(charCode) {
            return charCode >= 0x30A0 && charCode <= 0x30FF;
        }

        function isHiragana(charCode) {
            return charCode >= 0x3040 && charCode <= 0x309F;
        }

        function isHalfwidthKatakana(charCode) {
            return charCode >= 0xFF60 && charCode <= 0xFF9F;
        }

        function isThai(charCode) {
            return (charCode & 0xFF80) === 0x0E00;
        }
        
        if (isAlphabeticalScript(charCode)) {
            if (isAscii(charCode)) {
                if (isAsciiSpace(charCode)) {
                    return CharacterType.SPACE;
                } else if (isAsciiAlpha(charCode) || isAsciiDigit(charCode) || charCode === 0x5F) {
                    return CharacterType.ALPHA_LETTER;
                }
        
                return CharacterType.PUNCT;
            } else if (isThai(charCode)) {
                return CharacterType.THAI_LETTER;
            } else if (charCode === 0xA0) {
                return CharacterType.SPACE;
            }
        
            return CharacterType.ALPHA_LETTER;
        }
        
        if (isHan(charCode)) {
            return CharacterType.HAN_LETTER;
        } else if (isKatakana(charCode)) {
            return CharacterType.KATAKANA_LETTER;
        } else if (isHiragana(charCode)) {
            return CharacterType.HIRAGANA_LETTER;
        } else if (isHalfwidthKatakana(charCode)) {
            return CharacterType.HALFWIDTH_KATAKANA_LETTER;
        }
        
        return CharacterType.ALPHA_LETTER;
    }
    
    function _DisplayPdfSearchResultsDialogue(message) {
        var resultsDisplay = document.getElementById("PdfToolbarSearchResultsDiv");
        if (!resultsDisplay){
            return;
        }
        resultsDisplay.textContent = message;
    }

    String.prototype.insertTwo = function(idx1, str1, idx2, str2) {
        var slice1 = this.slice(0, idx1);
        var slice2 = this.slice(idx1, idx2);
        var slice3 = this.slice(idx2);
        return encodeHtml(slice1) + str1 + encodeHtml(slice2) + str2 + encodeHtml(slice3);
    }

    function encodeHtml(str) {
        var buf = [];
        for (var i=str.length-1;i>=0;i--) {
            buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
        }
        return buf.join('');
    }

    function decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
    
    function _removePdfSearchResultHighlights () {
        _matchSelected = {
            pageIdx:  -1,
            matchIdx: -1
        };
        if (_searchState) {
            _searchState.highlightAll = false;
        }
        _clearTextSelection();
        var textLayers = document.getElementsByClassName("PdfPageDisplayTextLayer");
        for (var i = 0; i < textLayers.length; i++) {
            var j = 0;
            while (j < textLayers[i].childNodes.length){
                if(textLayers[i].childNodes[j].className == "PdfSearchResultHighlight") {
                    textLayers[i].removeChild(textLayers[i].childNodes[j]);
                } else {
                    j++;
                }
            }
        }
    }

    function _convertMatches(matches, pageNo, callback) {
        if (!matches) {
            callback(null);
            return;
        }

        __PDF_DOC.getPage(pageNo).then(function(page) {
            page.getTextContent({ normalizeWhitespace: true }).then(function(textContent){
                var textContentItemsStr = [];
                var textLayerFrag = document.createDocumentFragment();
                PDFJS.renderTextLayer({
                    textContent: textContent,
                    container: textLayerFrag,
                    viewport: page.getViewport(__ZOOMSCALE, _pageRotation),
                    textContentItemsStr: textContentItemsStr,
                    enhanceTextSelection: true
                })._capability.promise.then(function(){
                    var i = 0,
                        iIndex = 0;
                    var end = textContentItemsStr.length - 1;
                    var queryLen = _searchTerm.length;
                    var result = [];

                    for (var m = 0, mm = matches.length; m < mm; m++) {
                        var matchIdx = matches[m];

                        while (i !== end && matchIdx >= iIndex + textContentItemsStr[i].length) {
                            iIndex += textContentItemsStr[i].length;
                            i++;
                        }

                        if (i === textContentItemsStr.length) {
                            console.error('Could not find a matching mapping');
                        }

                        var match = {
                            pageNo: pageNo,
                            begin: {
                            divIdx: i,
                            offset: matchIdx - iIndex
                            }
                        };

                        matchIdx += queryLen;

                        while (i !== end && matchIdx > iIndex + textContentItemsStr[i].length) {
                            iIndex += textContentItemsStr[i].length;
                            i++;
                        }

                        match.end = {
                            divIdx: i,
                            offset: matchIdx - iIndex
                        };
                        result.push(match);
                    }

                    callback(result);
                });
            });
        });
    }

    function _getHorizontalOffset(element, pos, length, first) {
        var canvas = null;
        if (_canvasTemplate == null) {
            canvas = document.createElement("canvas");

            _canvasTemplate = canvas.cloneNode(false);
        } else {
            canvas = _canvasTemplate.cloneNode(false);
        }
        var ctx = canvas.getContext('2d');
        ctx.font = element.style.fontSize + " " + element.style.fontFamily;

        if (first) {
            return (ctx.measureText(element.innerText.substr(0, pos)).width);
        } else {
            return (ctx.measureText(element.innerText.substr(pos, length)).width / 2);
        }
        
    }

    function _highlightTextElements(match) {
        var firstElement = null;
        var width = 0;

        var textLayer = document.querySelector("#PdfPageDisplayTextLayer" + match.pageNo);
        var i = match.begin.divIdx;
        var endi = match.end.divIdx;
        if (textLayer) {
            for (;i<=endi;i++) {
                var textElem = textLayer.querySelector("#PdfPageDisplayTextLayer" + match.pageNo + "_" + (i+1));
                if (textElem) {
                    if (!firstElement) firstElement = textElem;

                    var start = i == match.begin.divIdx ? match.begin.offset : 0;
                    var end = i == match.end.divIdx ? match.end.offset : textElem.innerText.length;
                    var length = end - start;

                    width += _getHorizontalOffset(textElem, start, length, false);

                    var highlightedTextElement = textElem.cloneNode(true);
                    highlightedTextElement.className = "PdfSearchResultHighlight";
                    highlightedTextElement.id = "PdfSearchResultHighlight" + match.pageNo + "_" + (i+1);
                    var htmlText = decodeHtml(highlightedTextElement.innerHTML);
                    htmlText = htmlText.insertTwo(start, "<span style='background-color: #0000FF; color: #0000FF;'>", end, "</span>");
                    highlightedTextElement.innerHTML = htmlText;

                    textElem.parentNode.appendChild(highlightedTextElement);
                }
            }
        }
        if (firstElement) {
            firstElement.dataset.width = width;
        }
        return firstElement;
    }

    function _showSearchResultHighlight() {
        if (_searchState && _searchState.highlightAll) {
            _highlightAllMatches();
        } else {
            if (_matchSelected.pageIdx != -1 &&
                _matchSelected.matchIdx != -1) {
                var pageNo = _matchSelected.pageIdx;
                var pageMatches = _pageMatches[pageNo] || null;
                _convertMatches(pageMatches, pageNo, function(matches) {
                    if (matches && matches.length) {
                        var match = matches[_matchSelected.matchIdx];
                        _highlightTextElements(match);
                    }
                });
            }
        }
    }

    function _checkLoadedPagesSearched() {
        var first = _firstLoadedPage;
        var last  = _lastLoadedPage;
        var running = false;
        for (var pageNo = first; pageNo <= last; pageNo++) {
            if (_pendingFindMatches[pageNo] == true) {
                running = true;
                break;
            }
        }

        if (running) {
            setTimeout(_checkLoadedPagesSearched, 100);
        } else {
            _highlightAllMatches();
        }
    }

    function _highlightAllMatches() {
        var first = _firstLoadedPage;
        var last  = _lastLoadedPage;
        for (var pageNo = first; pageNo <= last; pageNo++) {
            var pageMatches = _pageMatches[pageNo] || null;
            _convertMatches(pageMatches, pageNo, function(matches) {
                if (matches) {
                    for (var i=0;i<matches.length;i++) {
                        var match = matches[i];
                        _highlightTextElements(match);
                    }
                }
            });
        }
    }

    function _clearTextSelection() {
        if (window.getSelection) {
            if (window.getSelection().empty) { // Chrome, Edge and Firefox
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) { // IE
                window.getSelection().removeAllRanges();
            }
        }
    }

    function _getTextSelection() {
        _textSelection = {valid: false};
        var selection = window.getSelection();
        if (selection.type == "Range") {
            var startId = selection.anchorNode.parentNode.id;
            var startNumbers = startId.replace("PdfPageDisplayTextLayer","").split("_");
            var endId = selection.focusNode.parentNode.id;
            var endNumbers = endId.replace("PdfPageDisplayTextLayer","").split("_");

            if (startNumbers.length == 2 && endNumbers.length == 2) {
                var start = {
                    id: startId,
                    offset: selection.anchorOffset,
                    page: startNumbers[0],
                    no: startNumbers[1]
                };
                var end = {
                    id: endId,
                    offset: selection.focusOffset,
                    page: endNumbers[0],
                    no: endNumbers[1]
                };
                if (start.page < end.page) {
                    _textSelection.startNodeId = start.id;
                    _textSelection.startOffset = start.offset;
                    _textSelection.endNodeId = end.id;
                    _textSelection.endOffset = end.offset;
                } else if (start.page > end.page) {
                    _textSelection.startNodeId = end.id;
                    _textSelection.startOffset = end.offset;
                    _textSelection.endNodeId = start.id;
                    _textSelection.endOffset = start.offset;
                } else {
                    if (start.id < end.id) {
                        _textSelection.startNodeId = start.id;
                        _textSelection.startOffset = start.offset;
                        _textSelection.endNodeId = end.id;
                        _textSelection.endOffset = end.offset;
                    } else if (start.id > end.id) {
                        _textSelection.startNodeId = end.id;
                        _textSelection.startOffset = end.offset;
                        _textSelection.endNodeId = start.id;
                        _textSelection.endOffset = start.offset;
                    } else {
                        _textSelection.startNodeId = start.id;
                        _textSelection.startOffset = Math.min(start.offset, end.offset);
                        _textSelection.endNodeId = start.id;
                        _textSelection.endOffset = Math.max(start.offset, end.offset);
                    }
                }
                _textSelection.valid = true;
            }
        }
    }

    function _showTextSelection() {
        _clearTextSelection();
        if (_textSelection.valid) {
            var startNode = document.getElementById(_textSelection.startNodeId);
            var endNode = document.getElementById(_textSelection.endNodeId);
            if (startNode && startNode.firstChild &&
                endNode   && endNode.firstChild) {
                var range = document.createRange();
                range.setStart(startNode.firstChild, _textSelection.startOffset);
                range.setEnd(endNode.firstChild, _textSelection.endOffset);

                var selection = window.getSelection();
                selection.addRange(range);
            }
        }
    }
    
    //PDF SIDEBAR
    
    function _DisplayPdfNavigationBar (parent, pageNo) {
        var navDiv = document.getElementById("CreoViewDocumentNavbar");
        _clearNavPages(navDiv);
        if (!navDiv) {
            navDiv = document.createElement("div");
            navDiv.id = "CreoViewDocumentNavbar";
            navDiv.setAttribute('style', "background-color: #656872; height: " + (parseInt(parent.clientHeight) - parseInt(parent.firstChild.clientHeight)) + "px; width: 100%; overflow-y: scroll; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none");
            var newStyle = "#CreoViewDocumentNavbar::-webkit-scrollbar {display: none}";
            if (document.querySelector('style') &&
                document.querySelector('style').textContent.search(newStyle) == -1) {
                document.querySelector('style').textContent += newStyle;
            } else if (!document.querySelector('style')) {
                var style = document.createElement('style');
                style.textContent = newStyle;
                document.getElementsByTagName('head')[0].appendChild(style);
            }
            navDiv.addEventListener("scroll", function(){
                _handleNavOnScroll(navDiv);
            });
            parent.appendChild(navDiv);
        }
        _PopulatePdfNavigationBar(navDiv, pageNo);
    }
    
    function _PopulatePdfNavigationBar (navDiv, pageNo) {
        _ignoreNavScrollEvent = true;
        _prepareNavWrapper(1, navDiv, function(){
            _navbar.firstLoadedPage = Math.max(pageNo - _navbar.bufferSize, 1);
            _navbar.lastLoadedPage  = Math.min(pageNo + _navbar.bufferSize, __TOTAL_PAGES);
            _displayNavPages(_navbar.firstLoadedPage, function(){
                _selectNavPage(document.getElementById("PdfNavPageWrapper" + pageNo), pageNo);
                _scrollNavbarToPage(navDiv, pageNo);
            });
        });
    }

    function _prepareNavWrapper (pageNo, navDiv, callback){
        __PDF_DOC.getPage(pageNo).then(function(page){
            var viewport = page.getViewport(1, _pageRotation);

            var width = _navSidebarWidth - 2 * (_navWrapperBorder + _navWrapperMargin);
            var height = width * viewport.height / viewport.width;
            var newZoomScale = height / viewport.height;
            height = Math.floor(height);

            var navWrapper = null;
            if (_navWrapperTemplate == null) {
                navWrapper = document.createElement("div");
                navWrapper.setAttribute("style", "margin: 10px auto; display: block; box-shadow: 3px 3px 10px rgba(0,0,0,0.5); cursor: pointer;");

                _navWrapperTemplate = navWrapper.cloneNode(false);
            } else {
                navWrapper = _navWrapperTemplate.cloneNode(false);
            }

            navWrapper.dataset.zoomScale = newZoomScale;
            navWrapper.style.height = height + "px";
            navWrapper.style.width = width + "px";
            navWrapper.id = "PdfNavPageWrapper" + pageNo;
            navWrapper.title = "Page " + pageNo;
            navWrapper.addEventListener("click", function(){
                _selectNavPage(navWrapper, pageNo);
                _LoadPage(_pdfCallback, pageNo);
            });
            navWrapper.addEventListener("mouseenter", function(){
                document.body.style.cursor = "pointer";
            });
            navWrapper.addEventListener("mouseleave", function(){
                document.body.style.cursor = "auto";
            });
            navDiv.appendChild(navWrapper);
            if (pageNo < __TOTAL_PAGES) {
                _prepareNavWrapper(pageNo+1, navDiv, callback);
            } else {
                if (callback) {
                    callback();
                }
            }
        });
    }
    
    function _displayNavPages (pageNo, callback){
        __PDF_DOC.getPage(pageNo).then(function(page){
            var navWrapper = document.getElementById("PdfNavPageWrapper" + pageNo);
            if (navWrapper.childElementCount == 0) {
                var viewport = page.getViewport(parseFloat(navWrapper.dataset.zoomScale), _pageRotation);
                var canvas = document.createElement("canvas");
                canvas.id = "PdfNavPageCanvas" + pageNo;
                canvas.height = parseInt(viewport.height);
                canvas.width = parseInt(viewport.width);
                page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).then(function(){
                    if (navWrapper) {
                        navWrapper.appendChild(canvas);
                        if (pageNo < _navbar.lastLoadedPage){
                            _displayNavPages(pageNo+1, callback);
                        } else {
                            _ignoreNavScrollEvent = false;
                            if (callback) {
                                callback();
                            }
                        }
                    }
                });
            } else {
                if (pageNo < _navbar.lastLoadedPage){
                    _displayNavPages(pageNo+1, callback);
                } else {
                    _ignoreNavScrollEvent = false;
                    if (callback) {
                        callback();
                    }
                }
            }
        });
    }
    
    function _RemovePdfSideBar (parent){
        if (_sidebarEnabled) {
            var sideBar = document.getElementById("CreoViewDocumentSidebar");
            if (sideBar) {
                parent.removeChild(sideBar);
                var currentCanvas = document.getElementById(_currentCanvasId);
                if (currentCanvas) {
                    currentCanvas.parentNode.style.marginLeft = "auto";
                }
                parent.removeEventListener("mousemove", function(e){
                    _ResizePdfSideBar(e, parent, sidebarDiv, scrollWrapper);
                });
                parent.removeEventListener("mouseup", function(e){
                    if (_sidebarResize) {
                        parent.style.cursor = "auto";
                        sidebarDiv.style.cursor = "auto";
                        _sidebarResize = false;
                        if (_navbar.enabled) {
                            var navDiv = document.getElementById("CreoViewDocumentNavbar");
                            if ((parseInt(sidebarDiv.clientWidth) > _navSidebarWidth && navDiv.style.textAlign == "center")
                                || (parseInt(sidebarDiv.clientWidth) <= _navSidebarWidth && navDiv.style.textAlign == "left")) {
                                _clearNavPages(navDiv);
                                _PopulatePdfNavigationBar(navDiv, _navbar.selectedPage);
                            }
                        }
                    }
                });
                _sidebarResize = false;
            }
        }
    }
    
    function _RemovePdfNavigationBar (parent){
        if (_sidebarEnabled && _navbar.enabled){
            parent.removeChild(document.getElementById("CreoViewDocumentNavbar"));
        }
    }
    
    function _clearNavPages (navDiv) {
        if (_navbar.enabled && navDiv){
            while (navDiv.firstChild) {
                navDiv.removeChild(navDiv.firstChild);
            }
        }
    }

    function clearInvisibleNavWrappers() {
        var navWrappers = document.querySelectorAll("div[data-zoom-scale]");
        for (var i = 0; i < navWrappers.length; i++) {
            var pageNo = (i+1);
            if (pageNo < _navbar.firstLoadedPage || pageNo > _navbar.lastLoadedPage) {
                while (navWrappers[i].firstChild) {
                    navWrappers[i].removeChild(navWrappers[i].firstChild);
                }
            }
        }
    }

    function _handleNavOnScroll(navDiv) {
        if (_ignoreScrollEvent || _ignoreNavScrollEvent) {
            return;
        }

        var currentNavPage = _getCurrentNavPage(navDiv);

        if (!document.getElementById("PdfNavPageWrapper" + currentNavPage).firstChild ||
            ((currentNavPage - 1) < _navbar.firstLoadedPage && currentNavPage > 1) ||
            ((currentNavPage + 1) > (_navbar.lastLoadedPage - 1) && currentNavPage < (__TOTAL_PAGES - 1))) {
            _ignoreNavScrollEvent = true;
            _navbar.firstLoadedPage = Math.max(currentNavPage - _navbar.bufferSize, 1);
            _navbar.lastLoadedPage  = Math.min(currentNavPage + _navbar.bufferSize, __TOTAL_PAGES);
            _displayNavPages(_navbar.firstLoadedPage, function(){
                clearInvisibleNavWrappers();
                _ignoreNavScrollEvent = false;
            });
        }
    }

    function _getCurrentNavPage (navDiv) {
        var scrollTop = navDiv.scrollTop;
        var navWrapper1 = document.getElementById("PdfNavPageWrapper1");
        var offsetTop1 = navWrapper1.offsetTop;

        var scrollCenter = scrollTop + navDiv.clientHeight / 2;
        for (var i=1; i<=__TOTAL_PAGES; i++) {
            var navWrapper = document.getElementById("PdfNavPageWrapper" + i);

            var offsetTop = navWrapper.offsetTop - offsetTop1;
            var offsetBottom = offsetTop + navWrapper.offsetHeight + _navWrapperMargin;
            if (offsetTop <= scrollCenter && scrollCenter < offsetBottom) {
                return i;
            }
        }
    }

    function _selectNavPage(navWrapper, pageNo) {
        if (pageNo < 1 || pageNo > __TOTAL_PAGES || !navWrapper) {
            return;
        }
        if (_navbar.selectedPage > 0 && _navbar.selectedPage <= __TOTAL_PAGES) {
            document.getElementById("PdfNavPageWrapper" + _navbar.selectedPage).style.border = "none";
        }
        navWrapper.style.border = "6px solid #80858E";
        navWrapper.style.borderRadius = "3px";
        _navbar.selectedPage = pageNo;
    }
    
    function _scrollNavbarToPage (navDiv, pageNo) {
        if (pageNo > __TOTAL_PAGES || pageNo < 1 || !navDiv || (pageNo == 1 && __TOTAL_PAGES == 1)) {
            return;
        }

        var navWrapper1 = document.getElementById("PdfNavPageWrapper1");
        var offsetTop1 = navWrapper1.offsetTop;

        var navWrapper = document.getElementById("PdfNavPageWrapper" + pageNo);
        if (!navWrapper) return;
        
        var scrollBottom = navDiv.scrollTop + navDiv.clientHeight;
        var offsetTop = navWrapper.offsetTop - offsetTop1;
        var offsetBottom = offsetTop + navWrapper.offsetHeight + 2 * _navWrapperMargin;

        if (offsetTop < navDiv.scrollTop) {
            navDiv.scrollTop = offsetTop;
        } else if (offsetBottom > scrollBottom) {
            navDiv.scrollTop += (offsetBottom - scrollBottom);
        }

        _handleNavOnScroll(navDiv);
    }
    
    function _togglePdfSidePane () {
        var currentCanvas = document.getElementById(_currentCanvasId);
        if (!currentCanvas){
            return;
        }
        var parentNode = document.getElementById(_currentCanvasId).parentNode.parentNode;
        if (!parentNode){
            return;
        }
        if (_sidebarEnabled){
            _RemovePdfSideBar(parentNode);
            _adjustWrapperSize();
            _sidebarEnabled = false;
        } else {
            if (!_documentLoaded) return;
            _sidebarEnabled = true;
            var tempPageNo = __CURRENT_PAGE;
            if (_bookmarks.length <= 0) {
                _bookmarksBar.enabled = false;
                _navbar.enabled = true;
            }
            if (_navbar.enabled){
                _DisplayPdfNavigationBar(_CreateSideBar(parentNode), tempPageNo);
            } else if (_bookmarksBar.enabled){
                _DisplayPdfBookmarksBar(_CreateSideBar(parentNode));
            }
        }
    }
    
    function _CreateSideBar (parent) {
        if (document.getElementById("CreoViewDocumentSidebar")) {
            return;
        }
        var sidebarDiv = document.createElement("div");
        sidebarDiv.id = "CreoViewDocumentSidebar";
        sidebarDiv.style.float = "left";
        sidebarDiv.style.width = "25%";
        sidebarDiv.setAttribute('style', "float: left; width: " + _navSidebarWidth + "px;")
        if (_toolbarEnabled) {
            sidebarDiv.style.height = parseInt(parent.clientHeight) - _toolbarHeight + "px";
        } else {
            sidebarDiv.style.height = "100%";
        }
        var scrollWrapper = document.getElementById(_currentCanvasId).parentNode;
        parent.insertBefore(sidebarDiv, scrollWrapper);
        scrollWrapper.style.marginLeft = _navSidebarWidth + "px";
        var scrollWrapperTop = scrollWrapper.scrollTop;
        var scrollWrapperLeft = scrollWrapper.scrollLeft;
        if (_documentLoaded) {
            _refreshPDF(function(success){
                if (success) {
                    scrollWrapper.scrollTop = scrollWrapperTop;
                    scrollWrapper.scrollLeft = scrollWrapperLeft;
                
                    if (_pdfCallback) {
                        _pdfCallback(success);
                    }
                }
            });
        }
        
        var tabsDiv = document.createElement("div");
        tabsDiv.setAttribute('style', "width: 100%; height: " + _toolbarHeight + "px; background-color: #656872; position: relative; text-align: left");
        _PopulateSideBarTabs(tabsDiv);
        sidebarDiv.appendChild(tabsDiv);
        
        sidebarDiv.addEventListener("mouseover", function(e){
            if (!_sidebarResize 
                && e.clientX - parent.getBoundingClientRect().left > parseInt(sidebarDiv.style.width) - 5){
                sidebarDiv.style.cursor = "e-resize";
            }
        });
        
        sidebarDiv.addEventListener("mousemove", function(e){
            if (!_sidebarResize 
                && sidebarDiv.style.cursor == "e-resize" 
                && e.clientX - parent.getBoundingClientRect().left <= parseInt(sidebarDiv.style.width) - 5){
                    sidebarDiv.style.cursor = "auto";
            }
        });
        
        sidebarDiv.addEventListener("mousedown", function(e){
            if (!_sidebarResize 
                && e.clientX - parent.getBoundingClientRect().left > parseInt(sidebarDiv.style.width) - 5) {
                parent.style.cursor = "e-resize";
                _sidebarResize = true;
            }
        });
        
        parent.addEventListener("mouseup", function(e){
            if (_sidebarResize) {
                parent.style.cursor = "auto";
                sidebarDiv.style.cursor = "auto";
                _sidebarResize = false;
                if (_navbar.enabled) {
                    var navDiv = document.getElementById("CreoViewDocumentNavbar");
                    if ((parseInt(sidebarDiv.clientWidth) > _navSidebarWidth && navDiv.style.textAlign == "center")
                        || (parseInt(sidebarDiv.clientWidth) <= _navSidebarWidth && navDiv.style.textAlign == "left")) {
                        _clearNavPages(navDiv);
                        _PopulatePdfNavigationBar(navDiv, _navbar.selectedPage);
                    }
                }
            }
        });
        
        parent.addEventListener("mousemove", function(e){
            _ResizePdfSideBar(e, parent, sidebarDiv, scrollWrapper);
        });
        
        return sidebarDiv;
    }
    
    function _ResizePdfSideBar (e, parent, sidebarDiv, scrollWrapper) {
        if (_sidebarResize) {
            var newWidth = e.clientX - parent.getBoundingClientRect().left;
            if (newWidth > _navSidebarWidthLimit &&
                newWidth < parseInt(parent.clientWidth) - _navSidebarWidthLimit) {
                sidebarDiv.style.width = newWidth + "px";
                scrollWrapper.style.marginLeft = newWidth + "px";
                _navSidebarWidth = newWidth;
            }
        }
    }
    
    function _PopulateSideBarTabs (tabsDiv) {
        var navbarTab = _BuildDocumentToolbarButton('/icons/pdf_nav_pane.svg', false);
        navbarTab.id = "CreoSidebarNavbarButton";
        navbarTab.style.position = "absolute";
        navbarTab.style.bottom = "6px";
        navbarTab.style.left = "6px";
        navbarTab.style.backgroundColor = "inherit";
        if (_navbar.enabled) {
            navbarTab.style.backgroundColor = "#3B4550";
        }
        tabsDiv.appendChild(navbarTab);
        
        var bookmarksTab = _BuildDocumentToolbarButton('/icons/pdf_bookmark.svg', false);
        bookmarksTab.id = "CreoSidebarBookmarksButton"
        bookmarksTab.style.position = "absolute";
        bookmarksTab.style.bottom = "6px";
        bookmarksTab.style.left = "38px";
        bookmarksTab.style.backgroundColor = "inherit";
        if (_bookmarksBar.enabled && _bookmarks.length > 0) {
            bookmarksTab.style.backgroundColor = "#3B4550";
        }
        if (_bookmarks.length <= 0) {
            bookmarksTab.style.opacity = 0.5;
            bookmarksTab.style.cursor = "auto";
        }
        tabsDiv.appendChild(bookmarksTab);
        
        navbarTab.addEventListener("click", function(){
            if (!_navbar.enabled) {
                navbarTab.style.backgroundColor = "#3B4550";
                bookmarksTab.style.backgroundColor = "#656872";
                _RemovePdfBookmarksBar(tabsDiv.parentNode);
                _navbar.enabled = true;
                _bookmarksBar.enabled = false;
                _DisplayPdfNavigationBar(tabsDiv.parentNode, __CURRENT_PAGE);
            }
        });
        if (_bookmarks.length > 0) {
            bookmarksTab.addEventListener("click", function(){
                if (!_bookmarksBar.enabled) {
                    bookmarksTab.style.backgroundColor = "#3B4550";
                    navbarTab.style.backgroundColor = "#656872";
                    _RemovePdfNavigationBar(tabsDiv.parentNode);
                    _navbar.enabled = false;
                    _bookmarksBar.enabled = true;
                    _DisplayPdfBookmarksBar(tabsDiv.parentNode);
                }
            });
        }
        
        navbarTab.addEventListener("mouseenter", function(){
            if (!_navbar.enabled) {
                navbarTab.style.backgroundColor = "#3B4550";
            }
        });
        navbarTab.addEventListener("mouseleave", function(){
            if (!_navbar.enabled) {
                navbarTab.style.backgroundColor = "#656872";
            }
        });
        if (_bookmarks.length > 0) {
            bookmarksTab.addEventListener("mouseenter", function(){
                if (!_bookmarksBar.enabled) {
                    bookmarksTab.style.backgroundColor = "#3B4550";
                }
            });
            bookmarksTab.addEventListener("mouseleave", function(){
                if (!_bookmarksBar.enabled) {
                    bookmarksTab.style.backgroundColor = "#656872";
                }
            });
        }        
    }
    
    function _DisplayPdfBookmarksBar (parent) {
        var bookmarksDiv = document.createElement("div");
        bookmarksDiv.id = "CreoViewDocumentBookmarksBar";
        bookmarksDiv.setAttribute('style', "background-color: #656872; width: 100%; overflow-y: scroll; overflow-x: hidden; color: #FFFFFF; line-height: 30px; scrollbar-width: none; -ms-overflow-style: none");
        var newStyle = "#CreoViewDocumentBookmarksBar::-webkit-scrollbar {display: none}";
        if (document.querySelector('style') &&
            document.querySelector('style').textContent.search(newStyle) == -1) {
            document.querySelector('style').textContent += newStyle;
        } else if (!document.querySelector('style')) {
            var style = document.createElement('style');
            style.textContent = newStyle;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        bookmarksDiv.style.height = (parseInt(parent.clientHeight) - parseInt(parent.firstChild.clientHeight)) + "px";
        parent.appendChild(bookmarksDiv);
        _PopulatePdfBookmarksBar(bookmarksDiv);
    }
    
    function _PopulatePdfBookmarksBar (bookmarksDiv) {
        var bookmarksContent = document.createElement("div");
        bookmarksContent.id = "CreoViewDocumentBookmarksTreeWrapper";
        bookmarksContent.style.paddingTop = "5px";
        if(_bookmarks.length == 0){
            return;
        } else {
            _BuildDocumentBookmarksTree(bookmarksContent);
        }
        bookmarksDiv.appendChild(bookmarksContent);
    }
    
    function _BuildDocumentBookmarksTree(container) {
        var bookmarksTree = document.createElement("ul");
        bookmarksTree.id = "CreoViewDocumentBookmarksTree";
        bookmarksTree.setAttribute('style',"-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; text-align: left; margin-left: -40px");
        for(var i = 0; i<_bookmarks.length; i++){
            _BuildDocumentBookmarksTreeContent(_bookmarks[i], bookmarksTree, 40);
        }
        container.appendChild(bookmarksTree);
    }
    
    function _BuildDocumentBookmarksTreeContent(bookmark, bookmarksTree, marginCul) {
        var liElem = document.createElement("li");
        liElem.className = "CreoBookmarkElement";
        liElem.setAttribute('style',"color: #FFFFFF; background-color: transparent; position: relative; display: block");
        var highlightDiv = document.createElement("div");
        highlightDiv.setAttribute('style', "background-color: inherit; height: 30px; width: 100%; position: absolute; top: 0px; z-index: 1");
        liElem.appendChild(highlightDiv);
        if (bookmark.items.length == 0) {
            var spanElem = document.createElement("span");
            spanElem.textContent = bookmark.title;
            spanElem.setAttribute('style', "cursor: pointer; margin-left: " + (marginCul + 31) + "px; z-index: 2; position: relative; display: block; word-wrap: break-word");
            spanElem.addEventListener("click", function(){
                _ShowPdfBookmark(bookmark.title);
            });
            spanElem.addEventListener("mouseenter", function(){
                highlightDiv.style.height = spanElem.clientHeight;
                highlightDiv.style.backgroundColor = "#3B4550";
            });
            spanElem.addEventListener("mouseleave", function(){
                highlightDiv.style.backgroundColor = "inherit";
            });
            liElem.appendChild(spanElem);
        } else {
            var caretElem = document.createElement("span");
            caretElem.setAttribute('style', "cursor: pointer; z-index: 2; position: absolute; margin-left: " + marginCul + "px;");
            var caretImg = document.createElement("img");
            caretImg.src = ThingView.resourcePath + "icons/pdf_previous_find.svg";
            caretImg.setAttribute('style', "transform: rotate(-90deg); margin-top: 7px");
            caretElem.appendChild(caretImg);
            caretElem.addEventListener("click", function(){
                if(liElem.childNodes[3].style.display == "none"){
                    liElem.childNodes[3].style.display = "block";
                    caretImg.style.transform = "none";
                } else {
                    liElem.childNodes[3].style.display = "none";
                    caretImg.style.transform = "rotate(-90deg)";
                }
            });
            
            var spanElem = document.createElement("span");
            spanElem.setAttribute('style', "cursor: pointer; margin-left: " + (marginCul + 31) + "px; z-index: 2; position: relative; display: block; word-wrap: break-word");
            spanElem.textContent = bookmark.title;
            spanElem.addEventListener("click", function(){
                _ShowPdfBookmark(bookmark.title);
            });
            spanElem.addEventListener("mouseenter", function(){
                highlightDiv.style.height = spanElem.clientHeight;
                highlightDiv.style.backgroundColor = "#3B4550";
            });
            spanElem.addEventListener("mouseleave", function(){
                highlightDiv.style.backgroundColor = "inherit";
            });
            liElem.appendChild(caretElem);
            liElem.appendChild(spanElem);
            var ulElem = document.createElement("ul");
            ulElem.setAttribute('style', "display: none; margin-left: " + (0 - marginCul) + "px");
            liElem.appendChild(ulElem);
            for (var i = 0; i<bookmark.items.length; i++){
                _BuildDocumentBookmarksTreeContent(bookmark.items[i], ulElem, marginCul*2);
            }
        }
        bookmarksTree.appendChild(liElem);
    }
    
    function _ClearPdfBookmarksBar (bookmarksDiv) {
        if (_sidebarEnabled && _bookmarksBar.enabled) {
            while (bookmarksDiv.firstChild) {
                bookmarksDiv.removeChild(bookmarksDiv.firstChild);
            }
        }
    }
    
    function _RemovePdfBookmarksBar (parent) {
        if (_sidebarEnabled && _bookmarksBar.enabled){
            parent.removeChild(document.getElementById("CreoViewDocumentBookmarksBar"));
        }
    }
    
    function _BuildDocumentToolbarButton (imgURL, onLoadEvent) {
        var buttonDiv = document.createElement("div");
        buttonDiv.setAttribute('style', "-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; background-color: #44474B; margin-top: 6px; padding: 6px; cursor: pointer; display: inline-block; width: 16px; height: 16px");
        var buttonImage = document.createElement("img");
        if (onLoadEvent) {
            _AddToolbarButtonLoad(buttonImage);
        }
        buttonImage.src = ThingView.resourcePath + imgURL;
        buttonDiv.appendChild(buttonImage);
        return buttonDiv;
    }
    
    function _AddToolbarButtonMouseOver (button) {
        button.addEventListener("mouseenter", function(){
            button.style.backgroundColor = "#232B2D";
        });
        button.addEventListener("mouseleave", function(){
            button.style.backgroundColor = "#44474B";
        });
    }
    
    function _AddToolbarButtonLoad (buttonImage) {
        buttonImage.onload = function(){
            _toggleToolbarCover("none");
        }
    }
    
    // PDF ROTATE
    
    function _RotateDocumentPages (clockwise) {
        var newRotation = (_pageRotation + 360 + (clockwise ? 90 : -90)) % 360;
        _getScrollCenterData(__ZOOMSCALE);
        _pageRotation = newRotation;
        _refreshPDF(function(success){
            if (success) {
                if (_sidebarEnabled && _navbar.enabled) {
                    _DisplayPdfNavigationBar (document.getElementById(_currentCanvasId).parentNode.parentNode, __CURRENT_PAGE);
                }
                _pdfCallback();
            }
        }, {pageRotation: newRotation});
    }
    
    function _checkPageRotation() {
        if (_pageRotation == 0)
            return 0;
        else if (_pageRotation == 90)
            return 1;
        else if (_pageRotation == 180)
            return 2;
        else if (_pageRotation == 270)
            return 3;
    }
    
    // PDF PRINT
    
    function _PrintPdf (parent) {
        if (!_printEnabled || (_print && _print.running)) {
            return;
        }
        _print = {running: true};
        _preparePrintStyling();
        var printDiv = _preparePdfPrintDiv(parent);
        window.addEventListener('afterprint', _removePdfPrintDiv);
        _saveCurrentDocCursor();
        _populatePrintDiv(printDiv, 150/72, 1, __TOTAL_PAGES, function(){
            document.body.style.cursor = _printDocCursor;
            window.print();
        });
    }
    
    function _populatePrintDiv (printDiv, zoomScale, firstPage, lastPage, callback) {
        _preparePrintWrapper(firstPage, lastPage, printDiv, zoomScale, function(){
            _preparePrintPage (firstPage, lastPage, zoomScale, function(){
                if (!_filterPdfMarkups && _pdfParsedAnnotationSet != null && _pdfParsedAnnotationSet.length > 0) {
                    _preparePrintMarkup(0, printDiv, zoomScale, callback);
                } else {
                    callback();
                }
            });
        });
    }
    
    function  _preparePrintWrapper (pageNo, lastPage, printDiv, zoomScale, callback){
        __PDF_DOC.getPage(pageNo).then(function(page){
            var viewport = page.getViewport(zoomScale);
            var width = parseFloat(viewport.width);
            var height = parseFloat(viewport.height);
            var printWrapper = null;
            if (_printWrapperTemplate == null) {
                printWrapper = document.createElement("div");
                printWrapper.id = "PdfPrintWrapper" + pageNo;
                printWrapper.className = "PdfPrintElement PdfPrintWrapper";
                printWrapper.height = height;
                printWrapper.width = width;
                printWrapper.style.position = "relative";

                _printWrapperTemplate = printWrapper.cloneNode(false);
            } else {
                printWrapper = _printWrapperTemplate.cloneNode(false);

                printWrapper.id = "PdfPrintWrapper" + pageNo;
                printWrapper.height = height;
                printWrapper.width  = width;
            }
            printDiv.appendChild(printWrapper);
            if (pageNo >= lastPage) {
                if (callback) {
                    callback();
                }
            } else {
                _preparePrintWrapper(pageNo+1, lastPage, printDiv, zoomScale, callback);
            }
        });
    }
    
    function _preparePrintPage (pageNo, lastPage, zoomScale, callback){
        __PDF_DOC.getPage(pageNo).then(function(page){
            var printWrapper = document.getElementById("PdfPrintWrapper" + pageNo);
            var viewport = page.getViewport(zoomScale);
            var width = parseFloat(viewport.width);
            var height = parseFloat(viewport.height);
            var canvas = null;
            if (_printPageTemplate == null) {
                canvas = document.createElement("canvas");
                canvas.className = "PdfPrintElement";
                canvas.id = "PdfPrintPage" + pageNo;
                canvas.width = width;
                canvas.height = height;

                _printPageTemplate = canvas.cloneNode(false);
            } else {
                canvas = _printPageTemplate.cloneNode(false);

                canvas.id = "PdfPrintPage" + pageNo;
                canvas.width = width;
                canvas.height = height;
            }
            page.render({canvasContext: canvas.getContext('2d'), viewport: viewport, intent: 'print'}).then(function(){
                printWrapper.appendChild(canvas);
                if (pageNo < lastPage){
                    _preparePrintPage(pageNo+1, lastPage, zoomScale, callback);
                } else {
                    if (callback) {
                        callback();
                    }
                }
            });
        });
    }
    
    function _preparePrintMarkup (markupNo, printDiv, zoomScale, callback){
        _displayPrintMarkup (_pdfParsedAnnotationSet[markupNo], printDiv, zoomScale);
        if (markupNo < _pdfParsedAnnotationSet.length-1) {
            _preparePrintMarkup(markupNo+1, printDiv, zoomScale, callback);
        } else {
            var canvases = document.getElementsByClassName("PdfPrintAnnotationCanvas");
            var defs = "<defs class='PdfPrintAnnotation'><marker class='PdfPrintAnnotation' id='ClosedArrowPrint' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path class='PdfPrintAnnotation' d='M2,6 L9,1 L9,10 Z' style='fill:rgb(255,0,0);' /></marker><marker class='PdfPrintAnnotation' id='ClosedArrowNotePrint' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path class='PdfPrintAnnotation' d='M2,6 L9,1 L9,10 Z' style='fill:rgb(255,255,255);stroke:rgb(255,0,0)' /></marker><marker id='OpenArrowPrint' class='PdfPrintAnnotation' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path class='PdfPrintAnnotation' d='M9,1 L2,6 L9,10' style='fill:rgba(255,255,255,0);stroke:rgb(255,0,0)' /></marker><marker id='OpenArrowNotePrint' class='PdfPrintAnnotation' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path class='PdfPrintAnnotation' d='M9,1 L2,6 L9,10' style='fill:rgba(255,255,255,0);stroke:rgb(255,0,0)' /></marker><marker class='PdfPrintAnnotation' id='CirclePrint' markerWidth='9' markerHeight='9' refX='5' refY='5' orient='auto'><circle class='PdfPrintAnnotation' cx='5' cy='5' r='3' style='fill:rgb(255,0,0);' /></marker></defs>";
            var svgFooter = "</svg>";
            for (var i = 0; i < canvases.length; i++) {
                var canvasChildren = canvases[i].childNodes;
                var tempInnerHtml = "";
                var stamps = [];
                for (var j = 0; j < canvasChildren.length; j++) {
                    if (canvasChildren[j].tagName != "IMG") {
                        tempInnerHtml += canvasChildren[j].outerHTML;
                    } else {
                        stamps.push(canvasChildren[j]);
                    }
                }
                var svgHeader = "<svg class=\"PdfPrintAnnotation\" preserveAspectRatio=\"none\" "
                    + "height=\"" + canvases[i].clientHeight + "px\" "
                    + "width=\"" + canvases[i].clientWidth + "px\">";

                if (tempInnerHtml != "") {
                    canvases[i].innerHTML = svgHeader + defs + tempInnerHtml + svgFooter;
                } else {
                    canvases[i].innerHTML = "";
                }
                for (var k = 0; k < stamps.length; k++) {
                    canvases[i].appendChild(stamps[k]);
                }
            }
            if (callback) {
                callback();
            }
        }
    }
    
    function _displayPrintMarkup (annotation, printDiv, zoomScale) {
        var pdfCanvas = document.getElementById("PdfPrintWrapper" + (annotation.pageNo+1));
        if (!pdfCanvas) return;

        var canvasId = "PdfPrintAnnotationCanvas" + annotation.pageNo;
        var canvas = document.getElementById(canvasId);
        if(!canvas || canvas.parentNode.parentNode != printDiv){
            var width = parseFloat(pdfCanvas.width);
            var height = parseFloat(pdfCanvas.height);
            if (_printMarkupTemplate == null) {
                canvas = document.createElement("div");
                canvas.setAttribute('id', canvasId);
                canvas.setAttribute('class', "PdfPrintAnnotationCanvas PdfPrintAnnotation");
                canvas.setAttribute('width', width + "px");
                canvas.setAttribute('height', height + "px");
                canvas.setAttribute('style',"position: absolute; top: 0px; left: 0px; height: " + height + "px; width: " + width + "px; z-index: 3");

                _printMarkupTemplate = canvas.cloneNode(false);
            } else {
                canvas = _printMarkupTemplate.cloneNode(false);

                canvas.id = canvasId;
                canvas.width = width + "px";
                canvas.height = height + "px";
                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
            }
            pdfCanvas.insertBefore(canvas, pdfCanvas.firstChild);
        }
        switch (annotation.type) {
            case "LeaderLine":
                _displayPdfLeaderLine(annotation, canvas, true, zoomScale);
                break;
            case "PolyLine":
                _displayPdfPolyLine(annotation, canvas, true, zoomScale);
                break;
            case "Rectangle":
                _displayPdfRectangle(annotation, canvas, true, zoomScale);
                break;
            case "Circle":
                _displayPdfCircle(annotation, canvas, true, zoomScale);
                break;
            case "Polygon":
                _displayPdfPolygon(annotation, canvas, true, zoomScale);
                break;
            case "Freehand":
                _displayPdfFreehand(annotation, canvas, true, zoomScale);
                break;
            case "StrikeThrough":
                _displayPdfStrikeThrough(annotation, canvas, true, zoomScale);
                break;
            case "Underline":
                _displayPdfUnderline(annotation, canvas, true, zoomScale);
                break;
            case "Highlight":
                _displayPdfHighlight(annotation, canvas, true, zoomScale);
                break;
            case "Note":
                _displayPdfNote(annotation, canvas, true, zoomScale);
                break;
            case "Stamp":
                var stamp = _displayPdfStamp(annotation, canvas, true, zoomScale);
                canvas.appendChild(stamp);
                break;
            default:
                console.log("Annotation type not supported");
                break;
        }
    }
    
    function _preparePrintStyling () {
        //We don't need to remove a users @media print styling because the rules of precedence say the last in wins
        var newStyle = "@media print{ body :not(.PdfPrintElement){ display: none} .PdfPrintElement{width: 100% !important; border: none !important; padding: 0px !important; margin: 0px !important; visibility: visible !important} .PdfPrintAnnotationCanvas{transform: scale(1.01, 1.015) !important; margin: 1% auto auto 0.5% !important; visibility: visible !important} .PdfPrintElement, .PdfPrintAnnotation{height: 100% !important; overflow: visible !important; box-shadow: none !important; display: block !important; visibility: visible !important} .PdfPrintAnnotationStamp, .PdfPrintAnnotationNote {display: block !important} @page{ margin: 0px} *{ float: none !important}}";
        if (!document.querySelector('style')) {
            var style = document.createElement('style');
            style.textContent = newStyle;
            document.getElementsByTagName('head')[0].appendChild(style);
        } else {
            document.querySelector('style').textContent += newStyle;
        }
    }
    
    function _removePrintStyling () {
        document.querySelector('style').textContent.replace("@media print{ body :not(.PdfPrintElement){ display: none} .PdfPrintElement{width: 100% !important; border: none !important; padding: 0px !important; margin: 0px !important; visibility: visible !important} .PdfPrintAnnotationCanvas{transform: scale(1.01, 1.015) !important; margin: 1% auto auto 0.5% !important; visibility: visible !important} .PdfPrintElement, .PdfPrintAnnotation{height: 100% !important; overflow: visible !important; box-shadow: none !important; display: block !important; visibility: visible !important} .PdfPrintAnnotationStamp, .PdfPrintAnnotationNote {display: block !important} @page{ margin: 0px} *{ float: none !important}}", "");
    }
    
    function _addPdfPrintClass (element) {
        if (element.className != "") {
            element.className += " ";
        }
        element.className += "PdfPrintElement";
        if (element.parentNode && element.parentNode != document.body) {
            _addPdfPrintClass(element.parentNode);
        }
    }

    function _saveCurrentDocCursor() {
        _printDocCursor = document.body.style.cursor != "" ? document.body.style.cursor : "auto";
        document.body.style.cursor = "wait";
    }
    
    function _removePdfPrintDiv () {
        window.removeEventListener("afterprint", _removePdfPrintDiv);
        if (!_printEnabled || !_print || !_print.running) {
            return;
        }
        _print = null;
        _removePrintStyling();
        var printDiv = document.getElementById("PdfPrintDiv");
        printDiv.parentNode.removeChild(printDiv);
    }
    
    // MISC
    
    function _handleBrowserResize () {
        if (!_documentLoaded) return;

        if(_toolbarEnabled){
            _resizeDocumentToolbar(document.getElementById(_parentCanvasId), _toolbarGroups);
        }
        _adjustWrapperSize();
    }
    
     // PDF MARKUPS
    
    function _LoadPdfAnnotationSet(documentViewable, parentCanvasId, docScene, structure, annoSet, documentCallback) {
        _ignoreScrollEvent = true;
        _pdfAnnotationId = -1;
        _pdfParsedAnnotationSet = [];
        docScene.LoadPdf(documentViewable.idPath, documentViewable.index, structure, function(success) {
            if (!success) {
                return;
            }
            docScene.GetPdfBuffer(function(buffer){
                _LoadPdfDocument(parentCanvasId, buffer, false, function(){
                    _pdfRawAnnotationSet = annoSet;
                    _pdfParsedAnnotationSet = [];
                    _pageAnnoSetList = {};
                    _processPdfAnnotationSet(documentCallback);
                });
            });
        });
    }
    
    function _ApplyPdfAnnotationSet(annoSet, documentCallback) {
        _pdfRawAnnotationSet = annoSet;
        _pdfParsedAnnotationSet = [];
        _pageAnnoSetList = {};
        _processPdfAnnotationSet(documentCallback);
    }
    
    function _processPdfAnnotationSet(callback) {
        if (!_pdfRawAnnotationSet) {
            return;
        }

        if (_pdfParsedAnnotationSet.length == 0) {
            _parsePdfRawAnnotationSet(_pdfRawAnnotationSet);
        }

        _displayPdfAnnotations(_pdfParsedAnnotationSet);

        _ignoreScrollEvent = false;
        if (callback) {
            callback();
        }
    }

    function _displayPdfAnnotations(annoSet) {
        var canvases = document.getElementsByClassName("PdfAnnotationCanvas");
        for (var i = 0; i < canvases.length; i++) {
            canvases[i].innerHTML = "";
        }
        var stamps = [];
        for (var k = 0; k < annoSet.length; k++){
            var stamp = _displayPdfAnnotation(annoSet[k]);
            if (stamp){
                stamps.push(stamp);
            }
        }
        var defs = "<defs><marker id='ClosedArrow' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path d='M2,6 L9,1 L9,10 Z' style='fill:rgb(255,0,0);' /></marker><marker id='ClosedArrowNote' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path d='M2,6 L9,1 L9,10 Z' style='fill:rgb(255,255,255);stroke:rgb(255,0,0)' /></marker><marker id='OpenArrow' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path d='M9,1 L2,6 L9,10' style='fill:rgba(255,255,255,0);stroke:rgb(255,0,0)' /></marker><marker id='OpenArrowNote' markerWidth='11' markerHeight='11' refX='3' refY='6'orient='auto'><path d='M9,1 L2,6 L9,10' style='fill:rgba(255,255,255,0);stroke:rgb(255,0,0)' /></marker><marker id='Circle' markerWidth='9' markerHeight='9' refX='5' refY='5' orient='auto'><circle cx='5' cy='5' r='3' style='fill:rgb(255,0,0);' /></marker></defs>";
        var svgFooter = "</svg>";
        for (var i = 0; i < canvases.length; i++) {
            var svgHeader = "<svg height = " + canvases[i].clientHeight + " width = " + canvases[i].clientWidth + " style = 'z-index: 2; position: absolute; left: 0px; top: 0px'>";
            var tempInnerHtml = canvases[i].innerHTML;
            canvases[i].innerHTML = svgHeader + defs + tempInnerHtml + svgFooter;
        }
        for (var j = stamps.length-1; j >= 0; j--){
            var pushStamp = stamps[j];
            var canvas = document.getElementById("PdfAnnotationCanvas" + pushStamp.pageNo);
            canvas.insertBefore(pushStamp.stampImage, canvas.firstChild);
        }
        //The following has been commented out to disable move and delete for the CV 6.1 release
        /* var movableMarkups = document.getElementsByClassName("PdfAnnoMovable");
        for(var l = 0; l < movableMarkups.length; l++) {
            _addMarkupMoveEvents(movableMarkups[l]);
        }
        var deletableMarkups = document.getElementsByClassName("PdfAnnotationElement");
        for(var m = 0; m < deletableMarkups.length; m++) {
            _addMarkupSelectEvents(deletableMarkups[m]);
        }
        var parent = document.getElementById(_parentCanvasId);
        parent.addEventListener("mousedown", _deselectPdfAnnotation);
        window.addEventListener("keydown", _deletePdfAnnotationEvent); */
    }
    
    function _addMarkupMoveEvents (markup) {
        var drag = {
            x: 0,
            y: 0,
            index: -1,
            state: false
        };
        markup.addEventListener("mousedown", function(e){_handleMovePdfAnnoEvent(e, drag)});
        markup.addEventListener("mouseup", function(e){_handleMovePdfAnnoEvent(e, drag)});
        markup.addEventListener("mouseleave", function(e){_handleMovePdfAnnoEvent(e, drag)});
        markup.addEventListener("mouseenter", function(e){_handleMovePdfAnnoEvent(e, drag)});
        markup.addEventListener("mousemove", function(e){
            if(drag.state){
                _handleMovePdfAnnoEvent(e, drag);
            }
        });
    }
    
    function _addMarkupSelectEvents (markup) {
        markup.addEventListener("mousedown", function(e){_handleSelectPdfAnnoEvent(e)});
    }
    
    function _deletePdfAnnotationEvent (e) {
        if(e.key == "Delete") {
            _deletePdfAnnotation();
        }
    }

    function _getAnnotationCanvasTransform(rot, diff) {
        if (rot == 1) {
            // 90 deg
            return "rotate(90deg) translate(-" + diff + "px,-" + diff + "px)";
        } else if (rot == 2) {
            // 180 deg
            return "rotate(180deg)";
        } else if (rot == 3) {
            // 270 deg
            return "rotate(270deg) translate(" + diff + "px," + diff + "px)";
        } else {
            // 0 deg
            return 'unset';
        }
    }
    
    function _displayPdfAnnotation(annotation){
        if (annotation.pageNo < (_firstLoadedPage-1) || annotation.pageNo > (_lastLoadedPage-1)){
            return null;
        }
        var canvasId = "PdfAnnotationCanvas" + annotation.pageNo;
        var canvasWrapper = document.getElementById(_currentCanvasId);
        var canvas = document.getElementById(canvasId);
        if(!canvas || canvas.parentNode.parentNode != canvasWrapper){
            var pdfCanvas = document.getElementById("PdfPageDisplayWrapper" + (annotation.pageNo+1));
            var width = _checkPageRotation()%2==1 ? parseFloat(pdfCanvas.height) : parseFloat(pdfCanvas.width);
            var height = _checkPageRotation()%2==1 ? parseFloat(pdfCanvas.width) : parseFloat(pdfCanvas.height);
            if (_annotationTemplate == null) {
                canvas = document.createElement("div");
                canvas.setAttribute('id', canvasId);
                canvas.setAttribute('class', "PdfAnnotationCanvas");
                canvas.setAttribute('width', width + "px");
                canvas.setAttribute('height', height + "px");
                canvas.setAttribute('style',"position: absolute; top: 0px; left: 0px; height: " + height + "px; width: " + width + "px; z-index: 3; pointer-events:none;");
                canvas.style.transform = _getAnnotationCanvasTransform(_checkPageRotation(), Math.abs(width - height)/2);

                _annotationTemplate = canvas.cloneNode(false);
            } else {
                canvas = _annotationTemplate.cloneNode(false);

                canvas.id = canvasId;
                canvas.width = width + "px";
                canvas.height = height + "px";
                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
                canvas.style.transform = _getAnnotationCanvasTransform(_checkPageRotation(), Math.abs(width - height)/2);
            }

            if (_filterPdfMarkups) {
                canvas.style.visibility = "hidden";
            }
            pdfCanvas.insertBefore(canvas, pdfCanvas.firstChild);
        }
        switch (annotation.type) {
            case "LeaderLine":
                _displayPdfLeaderLine(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "PolyLine":
                _displayPdfPolyLine(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Rectangle":
                _displayPdfRectangle(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Circle":
                _displayPdfCircle(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Polygon":
                _displayPdfPolygon(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Freehand":
                _displayPdfFreehand(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "StrikeThrough":
                _displayPdfStrikeThrough(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Underline":
                _displayPdfUnderline(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Highlight":
                _displayPdfHighlight(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Note":
                _displayPdfNote(annotation, canvas, false, __ZOOMSCALE);
                return null;
            case "Stamp":
                return {
                    stampImage: _displayPdfStamp(annotation, canvas, false, __ZOOMSCALE),
                    pageNo: annotation.pageNo
                };
            default:
                console.log("Annotation type not supported");
                return null;
        }
    }

    function _parsePdfRawAnnotationSet(annoSet) {
        for (var i = 0; i < annoSet.length; i++) {
            var annotation = _parsePdfRawAnnotation(annoSet[i]);
            if (annotation) {
                _pdfParsedAnnotationSet.push(annotation);
                var pageNo = Number(annotation.pageNo+1);
                if (!_pageAnnoSetList[pageNo]) {
                    _pageAnnoSetList[pageNo] = [];
                }
                _pageAnnoSetList[pageNo].push(_pdfParsedAnnotationSet.length-1);
            }
        }
    }
    
    function _parsePdfRawAnnotation(rawAnno){
        switch (rawAnno.type){
            case "LeaderLine":
                return _parseLeaderLinePdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "PolyLine":
                return _parsePolyLinePdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Rectangle":
                return _parseRectanglePdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Circle":
                return _parseCirclePdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Polygon":
                return _parsePolygonPdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Freehand":
                return _parseFreehandPdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "StrikeThrough":
                return _parseStrikeThroughPdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Underline":
                return _parseUnderlinePdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Highlight":
                return _parseHighlightPdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Note":
                return _parseNotePdfRawAnno(rawAnno.data, rawAnno.pageNo);
            case "Stamp":
                return _parseStampPdfRawAnno(rawAnno.data, rawAnno.pageNo);
            default:
                console.log("Annotation type not supported");
                return null;
        }
    }
    
    function _getElementFromString(string, prefix, suffix) {
        if (suffix) {
            return string.substring(string.indexOf(prefix) + prefix.length, string.lastIndexOf(suffix));
        } else {
            return string.substring(string.indexOf(prefix) + prefix.length);
        }
    }
    
    function _getCorrectedBoundingBox(vertices, canvas, zoomScale){
        var box = {
            x1: vertices[0] < vertices[2] ? (vertices[0] * zoomScale) : (vertices[2] * zoomScale),
            x2: vertices[0] < vertices[2] ? (vertices[2] * zoomScale) : (vertices[0] * zoomScale),
            y2: vertices[1] > vertices[3] ? (parseInt(canvas.style.height) - (vertices[3] * zoomScale)) : (parseInt(canvas.style.height) - (vertices[1] * zoomScale)),
            y1: vertices[1] > vertices[3] ? (parseInt(canvas.style.height) - (vertices[1] * zoomScale)) : (parseInt(canvas.style.height) - (vertices[3] * zoomScale))
        }
        return box;
    }
    
    function _parseLeaderLinePdfRawAnno(data, pageNumber) {
        var annotation = {
            type: "LeaderLine",
            id: _getNextPdfAnnotationId(),
            vertices: _stringToFloatArray(_getElementFromString(data, "Vertices: ", ", Bounding")),
            boundingBox: _stringToFloatArray(_getElementFromString(data, "Bounding box: ", ", Head")),
            pageNo: pageNumber,
            head: _getElementFromString(data, "Head: ", ", Tail"),
            tail: _getElementFromString(data, "Tail: ")
        }
        return annotation;
    }
    
    function _parsePolyLinePdfRawAnno(data, pageNumber) {
        var annotation = _parseLeaderLinePdfRawAnno(data, pageNumber);
        annotation.type = "PolyLine";
        return annotation;
    }
    
    function _parseRectanglePdfRawAnno(data, pageNumber) {
        var annotation = {
            type: "Rectangle",
            id: _getNextPdfAnnotationId(),
            vertices: _stringToFloatArray(_getElementFromString(data, "Vertices: ", ", Filled")),
            pageNo: pageNumber,
            filled: _getElementFromString(data, "Filled: ") == "true" ? true : false
        }
        return annotation;
    }
    
    function _parseCirclePdfRawAnno(data, pageNumber) {
        var annotation = _parseRectanglePdfRawAnno(data, pageNumber);
        annotation.type = "Circle";
        return annotation;
    }
    
    function _parsePolygonPdfRawAnno(data, pageNumber) {
        var annotation = {
            type: "Polygon",
            id: _getNextPdfAnnotationId(),
            vertices: _stringToFloatArray(_getElementFromString(data, "Vertices: ", ", Bounding")),
            boundingBox: _stringToFloatArray(_getElementFromString(data, "Bounding box: ", ", Filled")),
            pageNo: pageNumber,
            filled: _getElementFromString(data, "Filled: ") == "true" ? true : false
        }
        return annotation;
    }
    
    function _parseFreehandPdfRawAnno(data, pageNumber) {
        var annotation = {
            type: "Freehand",
            id: _getNextPdfAnnotationId(),
            vertices: _stringToFloatArray(_getElementFromString(data, "Vertices: ", ", Bounding")),
            boundingBox: _stringToFloatArray(_getElementFromString(data, "Bounding box: ")),
            pageNo: pageNumber
        }
        return annotation;
    }
    
    function _parseStrikeThroughPdfRawAnno(data, pageNumber) {
        var annotation = {
            type: "StrikeThrough",
            id: _getNextPdfAnnotationId(),
            vertices: _stringToFloatArray(_getElementFromString(data, "Vertices: ", ", Bounding")),
            boundingBox: _stringToFloatArray(_getElementFromString(data, "Bounding box: ")),
            pageNo: pageNumber
        }
        return annotation;
    }
    
    function _parseUnderlinePdfRawAnno(data, pageNumber) {
        var annotation = _parseStrikeThroughPdfRawAnno(data, pageNumber);
        annotation.type = "Underline";
        return annotation;
    }
    
    function _parseHighlightPdfRawAnno(data, pageNumber) {
        var annotation = _parseStrikeThroughPdfRawAnno(data, pageNumber);
        annotation.type = "Highlight";
        return annotation;
    }
    
    function _parseNotePdfRawAnno(data, pageNumber) {
        var extractedContent = _getElementFromString(data, "Content: ", ", Font Family: ");
        data = data.replace(extractedContent, "");
        var lastIndex = 0;
        while(extractedContent.indexOf("\\r", lastIndex) != -1){
            var checkIndex = extractedContent.indexOf("\\r", lastIndex) - 1;
            if (!(checkIndex >= 0 && extractedContent.indexOf("\\\\r", lastIndex) == checkIndex)){
                var extractedSubstr = extractedContent.substr(extractedContent.indexOf("\\r", lastIndex));
                lastIndex = extractedContent.indexOf("\\r", lastIndex);
                var replaceSubstr = extractedSubstr.replace("\\r", " \n");
                extractedContent = extractedContent.replace(extractedSubstr, replaceSubstr);
            } else {
                lastIndex = extractedContent.indexOf("\\r", lastIndex) + 1;
                var extractIndex = checkIndex;
                while(extractIndex >= 1 && extractedContent[extractIndex-1] == "\\"){
                    extractIndex--;
                }
                var extractedSubstr = extractedContent.substr(extractIndex, checkIndex - extractIndex + 3);
                var replaceSubstr = Array((extractedSubstr.length-1)/2).join("\\");
                extractedContent = extractedContent.replace(extractedSubstr.substr(0,extractedSubstr.length-2), replaceSubstr);
            }
        }
        extractedContent = _sanitizeSvgText(extractedContent);
        var annotation = {
            type: "Note",
            id: _getNextPdfAnnotationId(),
            boundingBox: _stringToFloatArray(_getElementFromString(data, "Bounding box: ", ", Content")),
            pageNo: pageNumber,
            content: extractedContent,
            fontFamily: _getElementFromString(data, "Font Family: ", ", Text Alignment: "),
            textAlignment: _getElementFromString(data, "Text Alignment: ", ", Font Color:"),
            fontColor: _getElementFromString(data, "Font Color: ", ", Font Size:"),
            fontSize: parseFloat(_getElementFromString(data, "Font Size: ", ", Head:")),
            head: "",
            leaderLineVertices: []
        }
        if(data.indexOf("Leader Line Vertices: ") != -1){
            annotation.head = _getElementFromString(data, "Head: ", ", Leader Line Vertices");
            annotation.leaderLineVertices = _stringToFloatArray(_getElementFromString(data, "Leader Line Vertices: "));
        } else {
            annotation.head = _getElementFromString(data, "Head: ");
        }
        return annotation;
    }
    
    function _parseStampPdfRawAnno(data, pageNumber) {
        var annotation = {
            type: "Stamp",
            id: _getNextPdfAnnotationId(),
            vertices: _stringToFloatArray(_getElementFromString(data, "Vertices: ", ", Filter")),
            pageNo: pageNumber,
            filter: _getElementFromString(data, "Filter: ", ", Stream Length"),
            streamLength: parseInt(_getElementFromString(data, "Stream Length: ", ", Inflated Length")),
            inflatedLength: parseInt(_getElementFromString(data, "Inflated Length: ", ", Height")),
            height: parseInt(_getElementFromString(data, "Height: ", ", Width")),
            width: parseInt(_getElementFromString(data, "Width: ", ", Color Space")),
            colorSpace: _getElementFromString(data, "Color Space: ", ", Bits Per Component"),
            bitsPerComponent: parseInt(_getElementFromString(data, "Bits Per Component: ", ", Inflated Stream")),
            stream: _getElementFromString(data, "Inflated Stream: ")
        }
        return annotation;
    }
    
    // Displays
    function _displayPdfLeaderLine(annotation, canvas, printElement, zoomScale) {
        var svgElement =  "<line";
        if (printElement) {
            svgElement += " class = 'PdfPrintAnnotation'";
        }
        svgElement += " x1 = '" + (annotation.vertices[0] * zoomScale) + "' y1 = '" + (parseInt(canvas.style.height) - (annotation.vertices[1] * zoomScale)) + "' x2 = '" + (annotation.vertices[2] * zoomScale) + "' y2 = '" + (parseInt(canvas.style.height) - (annotation.vertices[3] * zoomScale)) + "' style = 'stroke:rgb(255,0,0);stroke-width:" + (1.5 * zoomScale) +"'";           
        var head = "";
        if(annotation.head != "None"){
            head = "marker-start='url(#" + annotation.head;
            if (printElement) {
                head += "Print";
            }
            head += ")' ";
        }  
        var tail = "";
        if(annotation.tail != "None"){
            tail = "marker-end='url(#" + annotation.tail;
            if (printElement) {
                tail += "Print";
            }
            tail += ")'";
        }
        var selectorBox = "";
        if (!printElement) {
            selectorBox = _buildLeaderLineSelectorBox(annotation.vertices, canvas, annotation.id);
        }
        var svgCombined = "<g";
        if (printElement) {
            svgCombined += " class = 'PdfPrintAnnotation'";
        }
        svgCombined += ">" + svgElement + head + tail + " /></line>" + selectorBox + "</g>";
        canvas.innerHTML += svgCombined;
    }
    
    function _displayPdfPolyLine(annotation, canvas, printElement, zoomScale) {
        var svgElement = "<polyline"
        if (printElement) {
            svgElement += " class = 'PdfPrintAnnotation'";
        }
        svgElement += " points='" + _createPolyPointPath(annotation, canvas, zoomScale) + "' style='fill:none;stroke:rgb(255,0,0);stroke-width:" + 1.5 * zoomScale + "' ";
        var head = "";
        if (annotation.head != "None"){
            head = "marker-start='url(#" + annotation.head;
            if (printElement) {
                head += "Print";
            }
            head += ")' ";
        }        
        var tail = "";
        if (annotation.tail != "None"){
            tail = "marker-end='url(#" + annotation.tail;
            if (printElement) {
                tail += "Print";
            }
            tail += ")'";
        }
        var selectorBox = "";
        if (!printElement) {
            selectorBox = _buildPolyLineSelectorBox(annotation.vertices, canvas, annotation.id, true);
        }
        var svgCombined = "<g";
        if (printElement) {
            svgCombined += " class = 'PdfPrintAnnotation'";
        }
        svgCombined += ">" + svgElement + head + tail + " /></polyline>" + selectorBox + "</g>";
        canvas.innerHTML += svgCombined;
    }
    
    function _displayPdfRectangle(annotation, canvas, printElement, zoomScale) {
        var box = _getCorrectedBoundingBox(annotation.vertices, canvas, zoomScale);
        var fill = annotation.filled ? "rgb(255,0,0)" : "transparent";
        var svgElement = "<rect id = 'PdfAnnotationElement" + annotation.id + "' class = 'PdfAnnotationElement PdfAnnoMovable";
        if (printElement) {
            svgElement += " PdfPrintAnnotation";
        }
        svgElement += "' data-selected='false' x='" + box.x1 + "' y='" + box.y1 + "' width='" + (box.x2 - box.x1) + "' height='" + (box.y2 - box.y1) + "' style='fill:" + fill + ";stroke:rgb(255,0,0);stroke-width:" + (1.5*zoomScale) + ";opacity:0.5' /></rect>";
        canvas.innerHTML += svgElement;
    }
    
    function _displayPdfCircle(annotation, canvas, printElement, zoomScale) {
        var box = _getCorrectedBoundingBox(annotation.vertices, canvas, zoomScale);
        var cx = (box.x2 + box.x1)/2;
        var cy = (box.y2 + box.y1)/2;
        var rx = (box.x2 - box.x1)/2;
        var ry = (box.y2 - box.y1)/2;
        var fill = annotation.filled ? "rgb(255,0,0)" : "transparent";
        var svgElement = "<ellipse id = 'PdfAnnotationElement" + annotation.id + "' class = 'PdfAnnotationElement PdfAnnoMovable";
        if (printElement) {
            svgElement += " PdfPrintAnnotation";
        }
        svgElement += "' data-selected='false' cx='" + cx + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "' style='stroke:rgb(255,0,0);stroke-width:" + (1.5*zoomScale) + ";fill:" + fill + ";opacity:0.5'/></ellipse>";
        canvas.innerHTML +=svgElement;
    }
    
    function _displayPdfPolygon(annotation, canvas, printElement, zoomScale) {
        var fill = annotation.filled ? "rgb(255,0,0)" : "transparent";
        var svgElement = "<polygon id = 'PdfAnnotationElement" + annotation.id + "' class = 'PdfAnnotationElement PdfAnnoMovable";
        if (printElement) {
            svgElement += " PdfPrintAnnotation";
        }
        svgElement += "' data-selected='false' points='" + _createPolyPointPath(annotation, canvas, zoomScale) + "' style='stroke:rgb(255,0,0);stroke-width:" + (1.5*zoomScale) + ";fill:" + fill + ";opacity:0.5'/></polygon>";
        canvas.innerHTML += svgElement;
    }
    
    function _displayPdfFreehand(annotation, canvas, printElement, zoomScale) {
        var path = "M" + (annotation.vertices[0] * zoomScale) + " " + (parseInt(canvas.style.height) - (annotation.vertices[1] * zoomScale));
        for (var i = 2; i < annotation.vertices.length-4; i+=4) {
            path += " Q" + (annotation.vertices[i] * zoomScale) + " " + (parseInt(canvas.style.height) - (annotation.vertices[i+1] * zoomScale)) + " " + (annotation.vertices[i+2] * zoomScale) + " " + (parseInt(canvas.style.height) - (annotation.vertices[i+3] * zoomScale));
        }
        var svgElement = "<path"
        if (printElement) {
            svgElement += " class = 'PdfPrintAnnotation'";
        }
        svgElement += " d='" + path + "' style='fill:none;stroke:rgb(255,0,0);stroke-width:" + (1.5*zoomScale) + ";stroke-linejoin:round' /></path>";
        var selectorBox = "";
        if (!printElement) {
            selectorBox = _buildFreehandSelectorBox(annotation.vertices, canvas, annotation.id);
        }
        var innerHTML = "<g";
        if (printElement) {
            innerHTML += " class=\"PdfPrintAnnotation\"";
        }
        innerHTML +=">" + svgElement + selectorBox + "</g>";
        canvas.innerHTML += innerHTML;
    }
    
    function _displayPdfStrikeThrough(annotation, canvas, printElement, zoomScale) {
        var path = "";
        for (var i = 0; i < annotation.vertices.length; i+=8){
            var x1 = annotation.vertices[i] * zoomScale;
            var y1 = (parseInt(canvas.style.height) - (((annotation.vertices[i+1] * zoomScale) + ((annotation.vertices[i+5] - 3) * zoomScale))/2));
            var x2 = annotation.vertices[i+2] * zoomScale;
            var y2 = (parseInt(canvas.style.height) - (((annotation.vertices[i+3] * zoomScale) + ((annotation.vertices[i+7] - 3) * zoomScale))/2));
            path += " M" + x1 + " " + y1 + " L" + x2 + " " + y2;
        }
        var svgElement = "<path";
        if (printElement) {
            svgElement += " class = 'PdfPrintAnnotation'";
        }
        svgElement += " d='" + path + "' style='stroke:rgb(255,0,0);stroke-width:" + (1.5*zoomScale) + "' /></path>";
        var selectorBox = "";
        if (!printElement) {
            selectorBox = _buildPolyLineSelectorBox(annotation.vertices, canvas, annotation.id, false);
        }
        var svgCombined = "<g";
        if (printElement) {
            svgCombined += " class = 'PdfPrintAnnotation'";
        }
        svgCombined += ">" + svgElement + selectorBox + "</g>";
        canvas.innerHTML += svgCombined;
    }
    
    function _displayPdfUnderline(annotation, canvas, printElement, zoomScale){
        var path = "";
        for (var i = 0; i < annotation.vertices.length; i+=8){
            var x1 = annotation.vertices[i] * zoomScale;
            var y1 = (parseInt(canvas.style.height) - ((annotation.vertices[i+5] + 2) * zoomScale));
            var x2 = annotation.vertices[i+2] * zoomScale;
            var y2 = (parseInt(canvas.style.height) - ((annotation.vertices[i+7] + 2) * zoomScale));
            path += " M" + x1 + " " + y1 + " L" + x2 + " " + y2;
        }
        var svgElement = "<path";
        if (printElement) {
            svgElement += " class = 'PdfPrintAnnotation'";
        }
        svgElement += " d='" + path + "' style='stroke:rgb(106,217,38);stroke-width:" + (1.5*zoomScale) + "' /></path>";
        var selectorBox = "";
        if (!printElement) {
            selectorBox = _buildPolyLineSelectorBox(annotation.vertices, canvas, annotation.id, false);
        }
        var svgCombined = "<g";
        if (printElement) {
            svgCombined += " class = 'PdfPrintAnnotation'";
        }
        svgCombined += ">" + svgElement + selectorBox + "</g>";
        canvas.innerHTML += svgCombined;
    }
    
    function _displayPdfHighlight(annotation, canvas, printElement, zoomScale){
        var path = "";
        for (var i = 0; i < annotation.vertices.length; i+=8){
            var x1 = annotation.vertices[i] * zoomScale;
            var y1 = (parseInt(canvas.style.height) - ((annotation.vertices[i+1]) * zoomScale));
            var x2 = annotation.vertices[i+2] * zoomScale;
            var y2 = (parseInt(canvas.style.height) - ((annotation.vertices[i+5]) * zoomScale));
            var xCurve1 = annotation.vertices[i] < annotation.vertices[i+2] ? (annotation.vertices[i] - 5)*zoomScale : (annotation.vertices[i] + 5)*zoomScale;
            var xCurve2 = annotation.vertices[i] > annotation.vertices[i+2] ? (annotation.vertices[i+2] - 5)*zoomScale : (annotation.vertices[i+2] + 5)*zoomScale;
            var yCurve = (y1 + y2) / 2;
            path += " M" + x1 + " " + y1 + " L" + x2 + " " + y1 + " S" + xCurve2 + " " + yCurve + " " + x2 + " " + y2 + " L" + x1 + " " + y2 + " S" + xCurve1 + " " + yCurve + " " + x1 + " " + y1;
        }
        var svgElement = "<path class = 'PdfAnnotationElement";
        if (printElement) {
            svgElement += " PdfPrintAnnotation";
        }
        svgElement += "' data-selected='false' id = 'PdfAnnotationElement" + annotation.id + "' d='" + path + "' style='stroke:rgb(255,171,0);stroke-width:1;fill:rgb(255,171,0);opacity:0.5' /></path>";
        canvas.innerHTML += svgElement;
    }
    
    function _displayPdfNote(annotation, canvas, printElement, zoomScale){
        var box = _getCorrectedBoundingBox(annotation.boundingBox, canvas, zoomScale);
        var svgElement = "<g";
        if (printElement) {
            svgElement += " class = 'PdfPrintAnnotationNote'";
        }
        svgElement += ">";
        var textX = 0;
        var textY = 0;
        if (annotation.head == "None"){
            textX = box.x1 + (2 * zoomScale);
            textY = box.y1 + (annotation.fontSize * zoomScale); 
        } else {
            box = _getCorrectedLeaderLineBoundingBox (annotation, box, canvas, zoomScale);
            var path = "M" + annotation.leaderLineVertices[0]*zoomScale + " " + (parseInt(canvas.style.height) - (annotation.leaderLineVertices[1] * zoomScale));

            for (var i = 2; i < annotation.leaderLineVertices.length; i+=2){
                path += " L" + (annotation.leaderLineVertices[i] * zoomScale) + " " + (parseInt(canvas.style.height) - (annotation.leaderLineVertices[i+1] * zoomScale));
            }
            svgElement += "<path";
            if (printElement) {
                svgElement += " class = 'PdfPrintAnnotationNote'";
            }
            svgElement += " d='" + path + "' style='stroke:#FF0000;stroke-width:" + (1.5*zoomScale) + ";fill:none'" + "marker-start='url(#" + annotation.head + "Note";
            if (printElement) {
                svgElement += "Print";
            }
            svgElement += ")' " + " /></path>";
            textX = box.x1 + (2 * zoomScale);
            textY = box.y1 + (annotation.fontSize * zoomScale);
        }
        var styleName = "";
        var j = 0;
        var found = false;
        while (!found){
            styleName = "TextStyle" + j + (printElement ? "Print" : "");
            if (canvas.innerHTML.indexOf(styleName + " { ") == -1) {
                found = true;
            } else {
                j++;
            }
        }
        var style = "<style> ." + styleName + " { font: normal " + (annotation.fontSize * zoomScale) + "px " + "arial, sans-serif" + "; fill: " + annotation.fontColor + "; }</style>";
        var formattedObject = _buildAdjustedNoteContent(annotation, box, canvas, printElement, zoomScale);
        var formattedContent = formattedObject.content;
        var rectHeight = annotation.head == "None" ? box.y2 - box.y1 : ((formattedObject.lineCount * annotation.fontSize + 5)) * zoomScale;
        svgElement += "<rect id = 'PdfAnnotationElement" + annotation.id + "' class = 'PdfAnnotationElement PdfAnnoMovable"
        if (printElement) {
            svgElement += " PdfPrintAnnotationNote";
        }
        svgElement += "' data-selected = 'false' x='" + box.x1 + "' y='" + box.y1 + "' width='" + (box.x2 - box.x1) + "' height='" + rectHeight + "' style='fill:#f5f4ea;stroke:#FF0000;stroke-width:" + (1.5*zoomScale) + "' /></rect>";
        svgElement += "<text pointer-events='none' x='" + textX + "' y='" + textY + "' class='" + styleName; 
        if (printElement) {
            svgElement += " PdfPrintAnnotationNote";
        }
        svgElement += "'>" + formattedContent + "</text>";
        svgElement += "</g>";
        var tempHtml = canvas.innerHTML;
        canvas.innerHTML = style + tempHtml + svgElement;
    }
    
    function _displayPdfStamp(annotation, canvas, printElement, zoomScale){
        var stampImage = document.createElement("img");
        stampImage.id = "PdfAnnotationElement" + annotation.id;
        stampImage.className = "PdfAnnoMovable";
        if (printElement) {
            stampImage.className += " PdfPrintAnnotationStamp";
        }
        stampImage.draggable = false;
        stampImage.src = "data:image/bmp;base64," + annotation.stream;
        var box = _getCorrectedBoundingBox(annotation.vertices, canvas, zoomScale);
        stampImage.setAttribute('style',"position: absolute; left: " + box.x1 + "px; top: " + box.y1 + "px; width: " + (box.x2 - box.x1) + "px; height: " + (box.y2 - box.y1) + "px; z-index: 1");
        return stampImage;
    }
    
    function _createPolyPointPath(annotation, canvas, zoomScale){
        var path = "";
        for (var i = 0; i < annotation.vertices.length; i++) {
            if (i%2==0) {
                path += annotation.vertices[i] * zoomScale;
                if (i<annotation.vertices.length - 1) {
                    path += ",";
                }
            } else {
                path += (parseInt(canvas.style.height) - (annotation.vertices[i] * zoomScale));
                if (i<annotation.vertices.length - 1) {
                    path += " ";
                }
            }
        }
        return path;
    }
    
    function _getCorrectedLeaderLineBoundingBox (annotation, box, canvas, zoomScale){
        var xLeader = annotation.leaderLineVertices[annotation.leaderLineVertices.length - 2] * zoomScale;
        var yLeader = parseInt(canvas.style.height) - (annotation.leaderLineVertices[annotation.leaderLineVertices.length - 1] * zoomScale);
        if ((box.x1 - xLeader) == (box.x2 - xLeader)) {
            if ((box.y1 - yLeader) < (box.y2 - yLeader)) {
                box.y1 = yLeader;
            } else {
                box.y2 = yLeader;
            }
        } else if ((box.x1 - xLeader) < (box.x2 - xLeader)) {
            box.x1 = xLeader;
        } else {
            box.x2 = xLeader;
        }
        return box;
    }

    function _createTSpan(xSPos, ySPos, scaledFontSize, lineNumber, content, print) {
        var tspan = "<tspan";
        if (print)
            tspan += " class = 'PdfPrintAnnotation'";
        tspan += " x='" + xSPos + "' y='" + (ySPos + (scaledFontSize * lineNumber)) + "'>" + content + "</tspan>";
        return tspan;
    }

    function findWrapIndex(canvas, content, scaledFontSize, boundingBox, zoomScale) {
        var maxWidth = boundingBox.x2 - boundingBox.x1 - (4 * zoomScale);
        var pxToPtConverter = (72/96);
        var calculateWidthDiv = document.createElement("div");
        calculateWidthDiv.setAttribute('style', "position: absolute; height: auto; width: auto; white-space: nowrap;");
        calculateWidthDiv.style.fontSize = scaledFontSize * pxToPtConverter + "pt";
        canvas.appendChild(calculateWidthDiv);
        calculateWidthDiv.innerHTML = content;

        if (calculateWidthDiv.clientWidth > maxWidth) {
            // Loop until it fits reducing one character at a time
            for (var i=content.length;i != 0;i--) {
                var testString = content.substring(0, i);
                calculateWidthDiv.innerHTML = testString;
                if (calculateWidthDiv.clientWidth <= maxWidth) {
                    // Break on a word if possible
                    var hasSpacePos = testString.lastIndexOf(" ");
                    if (hasSpacePos == -1) {
                        // No space - index is still i
                        canvas.removeChild(calculateWidthDiv);
                        return i;
                    } else {
                        canvas.removeChild(calculateWidthDiv);
                        return hasSpacePos;
                    }
                }
            }
        } else {
            canvas.removeChild(calculateWidthDiv);
            return -1; // no wrapping required
        }
    }

    function _buildAdjustedNoteContent(annotation, boundingBox, canvas, printElement, zoomScale){
        var scaledFontSize = (annotation.fontSize * zoomScale)
        var scaledXTextPosition = (boundingBox.x1 + (2 * zoomScale));
        var newLineChar = "\n";
        var lineFeedChar = "&#13;";

        // Split the content on new lines
        var splitContent = annotation.content.split(newLineChar);
        for (var a=0;a<splitContent.length;a++) {
            var newLines = splitContent[a].split(lineFeedChar);
            if (newLines.length > 1) {
                splitContent.splice(a,1);
                for (var s=0;s<newLines.length;s++) {
                    splitContent.splice(a+s, 0, newLines[s]);
                }
            }
        }

        for (var i=0;i<splitContent.length;++i) {
            var wi = findWrapIndex(canvas, splitContent[i], scaledFontSize, boundingBox, zoomScale);
            if (wi > 0) {
                splitContent.splice(i+1, 0, splitContent[i].substring(wi));
                if (splitContent[i+1][0] == " ") {
                    // Trim white space
                    splitContent[i+1] = splitContent[i+1].substring(1);
                }
                splitContent.splice(i, 1, splitContent[i].substring(0, wi));
            }
        }

        var tspanContent = "";
        for (var i=0;i<splitContent.length;++i) {
            tspanContent += _createTSpan(scaledXTextPosition, boundingBox.y1, scaledFontSize, i+1, splitContent[i], printElement);
        }

        var returnObject = {
            content: tspanContent,
            lineCount: splitContent.length
        }
        return returnObject;
    }

    function _sanitizeSvgText(content){
        content = content.replace(/</g,'&lt');
        content = content.replace(/>/g,'&gt');
        content = content.replace("\u0096", '&OElig;');
        content = content.replace("\u009c", '&oelig;');
        content = content.replace(/\\\(/g, '(');
        content = content.replace(/\\\)/g, ')');
        return content;
    }
    
    function _getNextPdfAnnotationId() {
        _pdfAnnotationId += 1;
        return _pdfAnnotationId;
    }
    
    function _buildLeaderLineSelectorBox (vertices, canvas, idNo) {
        var x1 = vertices[0] < vertices[2] ? (vertices[0]*__ZOOMSCALE) - 5 : (vertices[2]*__ZOOMSCALE) - 5;
        var y1 = vertices[1] > vertices[3] ? (canvas.clientHeight - (vertices[1]*__ZOOMSCALE)) - 5 : (canvas.clientHeight - (vertices[3]*__ZOOMSCALE)) - 5;
        var x2 = vertices[0] < vertices[2] ? (vertices[2]*__ZOOMSCALE) + 5 : (vertices[0]*__ZOOMSCALE) + 5;
        var y2 = vertices[1] > vertices[3] ? (canvas.clientHeight - (vertices[3]*__ZOOMSCALE)) + 5 : (canvas.clientHeight - (vertices[1]*__ZOOMSCALE)) + 5;
        var selectorBox = '<polygon id = "PdfAnnotationElement' + idNo +  '" class="PdfAnnotationElement PdfAnnoMovable" data-selected="false" points="' + x1 + ',' + y1 + ' ' + x2 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x1 + ',' + y2 + '" style="fill:transparent"></polygon>';
        return selectorBox;
    }
    
    function _buildPolyLineSelectorBox (vertices, canvas, idNo, movable) {
        var selectorBox = "<polygon id = 'PdfAnnotationElement" + idNo + "' class = 'PdfAnnotationElement";
        if (movable) {
            selectorBox += " PdfAnnoMovable";
        } 
        selectorBox += "' data-selected='false' points = '";
        for (var i = 0; i < vertices.length; i+=2) {
            selectorBox += ((vertices[i] * __ZOOMSCALE) - 5) + "," + ((canvas.clientHeight - (vertices[i+1] * __ZOOMSCALE)) - 5) + " ";
        }
        for (var j = vertices.length-1; j > 0; j-=2) {
            selectorBox += ((vertices[j-1] * __ZOOMSCALE) + 5) + "," + ((canvas.clientHeight - (vertices[j] * __ZOOMSCALE)) + 5) + " ";
        }
        selectorBox = selectorBox.substring(0, selectorBox.length-1);
        selectorBox += "' style='fill:transparent' ></polygon>";
        return selectorBox;
    }
    
    function _buildFreehandSelectorBox (vertices, canvas, idNo) {
        var selectorSize = 5 * __ZOOMSCALE
        var selectorGroup = "<g id = 'PdfAnnotationElement" + idNo + "' class = 'PdfAnnotationElement PdfAnnoMovable' data-selected = 'false'>"
        var previousSelectorBox = [];
        for (var i = 0; i < vertices.length - 2; i+=2) {
            var selectorBox = "<polygon points = '";
            var selectorSizeX =  vertices[i] < vertices[i+2] ? selectorSize : 0 - selectorSize;
            var selectorSizeY =  vertices[i+1] < vertices[i+3] ? selectorSize : 0 - selectorSize;
            var deltaX = Math.abs(vertices[i] - vertices[i+2]);
            var deltaY = Math.abs(vertices[i+1] - vertices[i+3]);
            if (deltaX > deltaY) {
                //if line is on the horizontal
                var newSelectorBox = [((vertices[i] * __ZOOMSCALE) - selectorSizeX), ((canvas.clientHeight - (vertices[i+1] * __ZOOMSCALE)) - selectorSizeY), ((vertices[i+2] * __ZOOMSCALE) + selectorSizeX), (((vertices[i+1] * __ZOOMSCALE)) + selectorSizeY)];
                selectorBox += ((vertices[i] * __ZOOMSCALE) - selectorSizeX) + "," + ((canvas.clientHeight - (vertices[i+1] * __ZOOMSCALE)) - selectorSizeY) + " ";
                selectorBox += ((vertices[i+2] * __ZOOMSCALE) + selectorSizeX) + "," + ((canvas.clientHeight - (vertices[i+3] * __ZOOMSCALE)) - selectorSizeY) + " ";
                selectorBox += ((vertices[i+2] * __ZOOMSCALE) + selectorSizeX) + "," + ((canvas.clientHeight - (vertices[i+3] * __ZOOMSCALE)) + selectorSizeY) + " ";
                selectorBox += ((vertices[i] * __ZOOMSCALE) - selectorSizeX) + "," + ((canvas.clientHeight - (vertices[i+1] * __ZOOMSCALE)) + selectorSizeY) + " ";
                previousSelectorBox = newSelectorBox;
            } else {
                //if line is on the vertical
                var newSelectorBox = [((vertices[i] * __ZOOMSCALE) - selectorSizeX), ((canvas.clientHeight - (vertices[i+1] * __ZOOMSCALE)) - selectorSizeY), ((vertices[i+2] * __ZOOMSCALE) - selectorSizeX), ((canvas.clientHeight - (vertices[i+3] * __ZOOMSCALE)) + selectorSizeY)];
                if(previousSelectorBox.length > 0 && newSelectorBox[1] != previousSelectorBox[1] && newSelectorBox[3] != previousSelectorBox[3]) {
                    if(Math.abs(newSelectorBox[1] - previousSelectorBox[1]) < Math.abs(newSelectorBox[3] - previousSelectorBox[3])) {
                        newSelectorBox[1] = previousSelectorBox[1];
                    } else {
                        newSelectorBox[3] = previousSelectorBox[3];
                    }
                }
                selectorBox += ((vertices[i] * __ZOOMSCALE) - selectorSizeX) + "," + newSelectorBox[1] + " ";
                selectorBox += ((vertices[i] * __ZOOMSCALE) + selectorSizeX) + "," + newSelectorBox[1] + " ";
                selectorBox += ((vertices[i+2] * __ZOOMSCALE) + selectorSizeX) + "," + newSelectorBox[3] + " ";
                selectorBox += ((vertices[i+2] * __ZOOMSCALE) - selectorSizeX) + "," + newSelectorBox[3] + " ";
                previousSelectorBox = newSelectorBox;
            }
            selectorBox += "' style='fill:transparent' ></polygon>";
            selectorGroup += selectorBox;
        }
        selectorGroup += "</g>";
        return selectorGroup;
    }

//PDF MOVE MARKUPS
    
    function _handleMovePdfAnnoEvent(e, drag) {
        e.stopPropagation();
        e.preventDefault();
        switch(e.type) {
            case "mouseenter":
                document.getElementById(_currentCanvasId).style.cursor = "move";
                break;
            case "mousedown":
                drag.x = e.pageX;
                drag.y = e.pageY;
                drag.state = true;
                _reorderSVGElement(e.target, drag, true);
                break;
            case "mousemove":
                _movePdfAnno(e, drag);
                break;
            case "mouseleave":
                _reorderSVGElement(e.target, drag, false);
                drag.state = false;
                document.getElementById(_currentCanvasId).style.cursor = "auto";
            case "mouseup":
                _reorderSVGElement(e.target, drag, false);
                drag.state = false;
                break;
            default:
                return;
        }
    }
    
    function _reorderSVGElement(target, drag, bringToFront) {
        var parent = target.parentNode;
        var redrawNode = target;
        while (parent.tagName != "svg" && parent.parentNode) {
            redrawNode = parent;
            parent = parent.parentNode;
        }
        if (bringToFront) {
            drag.index = -1;
            for (var i = 0; i < parent.childNodes.length; i++) {
                if (parent.childNodes[i] == redrawNode) {
                    drag.index = i;
                    break;
                }
            }
            if (drag.index < 0) {
                return;
            }
            parent.appendChild(redrawNode);
        } else {
            if(drag.index < 0) {
                return;
            }
            parent.insertBefore(redrawNode, parent.childNodes[drag.index]);
            drag.index = -1;
        }
    }
    
    function _movePdfAnno(e, drag) {
        e.preventDefault()
        var parsedAnno = _getParsedAnnotation(e.target);
        var deltaX = e.pageX - drag.x;
        var deltaY = e.pageY - drag.y;
        switch (parsedAnno.type) {
            case "LeaderLine" :
                _moveLeaderLineAnno(deltaX, deltaY, parsedAnno, e.target);
                break;
            case "PolyLine" :
                _movePolyLineAnno(deltaX, deltaY, parsedAnno, e.target);
                break;
            case "Rectangle" :
                _moveRectangleAnno(deltaX, deltaY, parsedAnno, e.target);
                break;
            case "Circle" :
                _moveCircleAnno(deltaX, deltaY, parsedAnno, e.target);
                break;
            case "Polygon" :
                _movePolygonAnno(deltaX, deltaY, parsedAnno, e.target);
                break;
            case "Freehand" :
                _moveFreehandAnno(deltaX, deltaY, parsedAnno, e.target);
                break
            case "Note" :
                _moveNoteAnno(deltaX, deltaY, parsedAnno, e.target);
                break;
            case "Stamp" :
                _moveStampAnno(deltaX, deltaY, parsedAnno, e.target);
                break;
            default:
                break;
        }
        drag.x = e.pageX;
        drag.y = e.pageY;
    }
    
    function _moveRectangleAnno(deltaX, deltaY, parsedAnno, target) {
        target.setAttribute("x", parseInt(target.attributes.x.nodeValue) + deltaX);
        target.setAttribute("y", parseInt(target.attributes.y.nodeValue) + deltaY);
        parsedAnno.vertices[0] += deltaX;
        parsedAnno.vertices[1] += deltaY;
        parsedAnno.vertices[2] += deltaX;
        parsedAnno.vertices[3] += deltaY;
    }
    
    function _moveCircleAnno(deltaX, deltaY, parsedAnno, target) {
        target.setAttribute("cx", parseInt(target.attributes.cx.nodeValue) + deltaX);
        target.setAttribute("cy", parseInt(target.attributes.cy.nodeValue) + deltaY);
        parsedAnno.vertices[0] += deltaX;
        parsedAnno.vertices[1] += deltaY;
        parsedAnno.vertices[2] += deltaX;
        parsedAnno.vertices[3] += deltaY;
    }
    
    function _movePolygonAnno(deltaX, deltaY, parsedAnno, target) {
        var points = target.attributes.points.nodeValue.split(" ");
        var newPoints = "";
        for (var i = 0; i < points.length; i++) {
            points[i] = points[i].split(",");
            points[i][0] = parseInt(points[i][0]) + deltaX;
            points[i][1] = parseInt(points[i][1]) + deltaY;
            newPoints += points[i][0] + "," + points[i][1] + " ";
        }
        newPoints = newPoints.substring(0, newPoints.length-1);
        target.setAttribute("points", newPoints);
        for (var j = 0; j < parsedAnno.vertices.length-2; j+=2) {
            parsedAnno.vertices[j] += deltaX;
            parsedAnno.vertices[j+1] += deltaY;
        }
    }
    
    function _moveNoteAnno(deltaX, deltaY, parsedAnno, target) {
        var parentGroup = target.parentNode;
        for (var i = 0; i < parentGroup.childNodes.length; i++) {
            var node = parentGroup.childNodes[i];
            switch (node.tagName) {
                case "rect":
                    node.setAttribute("x", parseInt(node.attributes.x.nodeValue) + deltaX);
                    node.setAttribute("y", parseInt(node.attributes.y.nodeValue) + deltaY);
                    break;
                case "text" :
                    node.setAttribute("x", parseInt(node.attributes.x.nodeValue) + deltaX);
                    node.setAttribute("y", parseInt(node.attributes.y.nodeValue) + deltaY);
                    for (var j = 0; j < node.childNodes.length; j++) {
                        if (node.childNodes[j].tagName == "tspan") {
                            node.childNodes[j].setAttribute("x", parseInt(node.childNodes[j].attributes.x.nodeValue) + deltaX);
                            node.childNodes[j].setAttribute("y", parseInt(node.childNodes[j].attributes.y.nodeValue) + deltaY);
                        }
                    }
                    break;
                case "path" :
                    var newPath = "";
                    var pathArray = node.attributes.d.nodeValue.split(" L");
                    for (var k = 0; k < pathArray.length; k++) {
                        pathArray[k] = pathArray[k].split(" ");
                        if(pathArray[k][0].indexOf("M") != -1) {
                            pathArray[k][0] = pathArray[k][0].replace("M", "");
                        }
                        pathArray[k][0] = parseInt(pathArray[k][0]) + deltaX;
                        pathArray[k][1] = parseInt(pathArray[k][1]) + deltaY;
                        newPath += "L" + pathArray[k][0] + " " + pathArray[k][1] + " ";
                    }
                    newPath = "M" + newPath.substring(1, newPath.length-1);
                    node.setAttribute("d", newPath);
                    break;
                default:
                    break;
            }
        }
        for (var l = 0; l < parsedAnno.boundingBox.length-2; l+=2) {
            parsedAnno.boundingBox[l] += deltaX;
            parsedAnno.boundingBox[l+1] += deltaY;
        }
        for (var m = 0; m < parsedAnno.leaderLineVertices.length-2; m+=2) {
            parsedAnno.leaderLineVertices[m] += deltaX;
            parsedAnno.leaderLineVertices[m+1] += deltaY;
        }
    }
    
    function _moveStampAnno (deltaX, deltaY, parsedAnno, target) {
        target.style.left =  parseInt(target.style.left) + deltaX + "px";
        target.style.top = parseInt(target.style.top) + deltaY + "px";
        parsedAnno.vertices[0] += deltaX;
        parsedAnno.vertices[1] += deltaY;
        parsedAnno.vertices[2] += deltaX;
        parsedAnno.vertices[3] += deltaY;
    }
    
    function _moveLeaderLineAnno(deltaX, deltaY, parsedAnno, target) {
        for (var i = 0; i < target.parentNode.childNodes.length; i++) {
            var node = target.parentNode.childNodes[i];
            switch (node.tagName) {
                case "line" :
                    node.setAttribute('x1', parseInt(node.attributes.x1.nodeValue) + deltaX);
                    node.setAttribute('x2', parseInt(node.attributes.x2.nodeValue) + deltaX);
                    node.setAttribute('y1', parseInt(node.attributes.y1.nodeValue) + deltaY);
                    node.setAttribute('y2', parseInt(node.attributes.y2.nodeValue) + deltaY);
                    break;
                case "polygon" :
                    _updateNodePointsArray(node, deltaX, deltaY);
                    break;
                default :
                    break;
            }
        }
        for (var l = 0; l < parsedAnno.boundingBox.length-2; l+=2) {
            parsedAnno.boundingBox[l] += deltaX;
            parsedAnno.boundingBox[l+1] += deltaY;
        }
        for (var m = 0; m < parsedAnno.vertices.length-2; m+=2) {
            parsedAnno.vertices[m] += deltaX;
            parsedAnno.vertices[m+1] += deltaY;
        }
    }
    
    function _movePolyLineAnno (deltaX, deltaY, parsedAnno, target) {
        for (var i = 0; i < target.parentNode.childNodes.length; i++) {
            var node = target.parentNode.childNodes[i];
            switch (node.tagName) {
                case "polyline" :
                case "polygon" :
                    _updateNodePointsArray(node, deltaX, deltaY);
                    break;
                default :
                    break;
            }
        }
        for (var l = 0; l < parsedAnno.boundingBox.length-2; l+=2) {
            parsedAnno.boundingBox[l] += deltaX;
            parsedAnno.boundingBox[l+1] += deltaY;
        }
        for (var m = 0; m < parsedAnno.vertices.length-2; m+=2) {
            parsedAnno.vertices[m] += deltaX;
            parsedAnno.vertices[m+1] += deltaY;
        }
    }
    
    function _moveFreehandAnno(deltaX, deltaY, parsedAnno, target) {
        for (var i = 0; i < target.parentNode.parentNode.childNodes.length; i++) {
            var node = target.parentNode.parentNode.childNodes[i];
            switch (node.tagName) {
                case "path" :
                    var newPath = "";
                    var pathArray = node.attributes.d.nodeValue.split(" Q");
                    pathArray[0] = pathArray[0].split(" ");
                    pathArray[0][0] = pathArray[0][0].replace("M", "");
                    newPath += "M" + (parseInt(pathArray[0][0]) + deltaX) + " " + (parseInt(pathArray[0][1]) + deltaY) + " ";
                    for (var k = 1; k < pathArray.length; k++) {
                        pathArray[k] = pathArray[k].split(" ");
                        pathArray[k][0] = parseInt(pathArray[k][0]) + deltaX;
                        pathArray[k][1] = parseInt(pathArray[k][1]) + deltaY;
                        pathArray[k][2] = parseInt(pathArray[k][2]) + deltaX;
                        pathArray[k][3] = parseInt(pathArray[k][3]) + deltaY;
                        newPath += "Q" + pathArray[k][0] + " " + pathArray[k][1] + " " + pathArray[k][2] + " " + pathArray[k][3] + " ";
                    }
                    newPath = newPath.substring(0, newPath.length-1);
                    node.setAttribute("d", newPath);
                    break;
                case "g" :
                    for (var j = 0; j < node.childNodes.length; j++) {
                        if (node.childNodes[j].tagName == "polygon") {
                            _updateNodePointsArray(node.childNodes[j], deltaX, deltaY);
                        }
                    }
                    break;
                default :
                    break;
            }
        }
        for (var l = 0; l < parsedAnno.boundingBox.length-2; l+=2) {
            parsedAnno.boundingBox[l] += deltaX;
            parsedAnno.boundingBox[l+1] += deltaY;
        }
        for (var m = 0; m < parsedAnno.vertices.length-2; m+=2) {
            parsedAnno.vertices[m] += deltaX;
            parsedAnno.vertices[m+1] += deltaY;
        }
    }
    
    function _updateNodePointsArray (node, deltaX, deltaY) {
        var newPoints = "";
        var pointsArray = node.attributes.points.nodeValue.split(" ");
        for (var j = 0; j < pointsArray.length; j++) {
            pointsArray[j] = pointsArray[j].split(",");
            pointsArray[j][0] = parseInt(pointsArray[j][0]) + deltaX;
            pointsArray[j][1] = parseInt(pointsArray[j][1]) + deltaY;
            newPoints += pointsArray[j][0] + "," + pointsArray[j][1] + " ";
        }
        node.setAttribute("points", newPoints.substring(0,newPoints.length-1));
    }
    
    function _getParsedAnnotation (markup) {
        var annoId = -1;
        if (markup.id.length == 0) {
            if (markup.parentNode.id.length > 0) {
                annoId = parseInt(markup.parentNode.id.substring(20));
            } else if (markup.childNodes[0].id.length > 0) {
                annoId = parseInt(markup.childNodes[0].id.substring(20));
            } else if (markup.childNodes[1].id.length > 0) {
                annoId = parseInt(markup.childNodes[1].id.substring(20));
            }
        } else {
            annoId = parseInt(markup.id.substring(20));
        }
        if(annoId == null || annoId < 0) {
            return;
        }
        return _pdfParsedAnnotationSet[annoId];
    }
    
//PDF DELETE MARKUPS
    
    function _handleSelectPdfAnnoEvent (e) {
        e.preventDefault();
        e.stopPropagation();
        if (_selectedAnnotation) {
             _togglePdfAnnotationSelect(_selectedAnnotation);
        }
        if (e.target.dataset.selected == "false" && e.target != _selectedAnnotation){
            _togglePdfAnnotationSelect(e.target);
        } else if (e.target.parentNode.dataset.selected == "false" && e.target.parentNode != _selectedAnnotation){
            _togglePdfAnnotationSelect(e.target.parentNode);
        }
    }
    
    function _deselectPdfAnnotation () {
        if (_selectedAnnotation) {
            _togglePdfAnnotationSelect(_selectedAnnotation);
        }
    }
    
    function _togglePdfAnnotationSelect(markup) {
        if (!markup) {
            return;
        }
        var parsedAnno = _getParsedAnnotation(markup);
        if (markup.dataset.selected == "false") {
            markup.dataset.selected = "true";
            switch (parsedAnno.type) {
                case "LeaderLine" :
                    _selectedAnnotation = markup.parentNode;
                    for (var i = 0; i < markup.parentNode.childNodes.length; i++) {
                        if (markup.parentNode.childNodes[i].tagName == "line") {
                            _highlightPdfAnnotationShape(markup.parentNode.childNodes[i], "rgb(0,0,255)");
                        }
                    }
                    break;
                case "PolyLine" :
                    _selectedAnnotation = markup.parentNode;
                    for (var i = 0; i < markup.parentNode.childNodes.length; i++) {
                        if (markup.parentNode.childNodes[i].tagName == "polyline") {
                            _highlightPdfAnnotationShape(markup.parentNode.childNodes[i], "rgb(0,0,255)");
                        }
                    }
                    break;
                case "Rectangle" :
                case "Circle" :
                case "Polygon" :
                    _selectedAnnotation = markup;
                    _highlightPdfAnnotationShape(markup, "rgb(0,0,255)");
                    break;
                case "Freehand" :
                case "Underline" :
                case "StrikeThrough" :
                    _selectedAnnotation = markup.parentNode;
                    for (var i = 0; i < markup.parentNode.childNodes.length; i++) {
                        if (markup.parentNode.childNodes[i].tagName == "path") {
                            _highlightPdfAnnotationShape(markup.parentNode.childNodes[i], "rgb(0,0,255)");
                        }
                    }
                    break
                case "Note" :
                    _selectedAnnotation = markup.parentNode;
                    for (var i = 0; i < markup.parentNode.childNodes.length; i++) {
                        if (markup.parentNode.childNodes[i].tagName == "rect") {
                            _highlightPdfAnnotationShape(markup.parentNode.childNodes[i], "rgb(0,0,255)");
                        }
                    }
                    break;
                case "Stamp" :
                    //
                    break;
                case "Highlight" :
                    _highlightPdfAnnotationShape(markup, "rgb(0,0,255)");
                    break;
                default:
                    break;
            }
        } else {
            switch (parsedAnno.type) {
                case "LeaderLine" :
                    for (var i = 0; i < markup.childNodes.length; i++) {
                        if (markup.childNodes[i].dataset.selected) {
                            markup.childNodes[i].dataset.selected = "false";
                        }
                        if (markup.childNodes[i].tagName == "line") {
                            _highlightPdfAnnotationShape(markup.childNodes[i], "rgb(255,0,0)");
                        }
                    }
                    break;
                case "PolyLine" :
                    for (var i = 0; i < markup.childNodes.length; i++) {
                        if (markup.childNodes[i].dataset.selected) {
                            markup.childNodes[i].dataset.selected = "false";
                        }
                        if (markup.childNodes[i].tagName == "polyline") {
                            _highlightPdfAnnotationShape(markup.childNodes[i], "rgb(255,0,0)");
                        }
                    }
                    break;
                case "Rectangle" :
                case "Circle" :
                case "Polygon" :
                    markup.dataset.selected = "false";
                    _highlightPdfAnnotationShape(markup, "rgb(255,0,0)");
                    break;
                case "Freehand" :
                case "StrikeThrough" :
                    for (var i = 0; i < markup.childNodes.length; i++) {
                        if (markup.childNodes[i].dataset.selected) {
                            markup.childNodes[i].dataset.selected = "false";
                        }
                        if (markup.childNodes[i].tagName == "path") {
                            _highlightPdfAnnotationShape(markup.childNodes[i], "rgb(255,0,0)");
                        }
                    }
                    break
                case "Note" :
                    for (var i = 0; i < markup.childNodes.length; i++) {
                        if (markup.childNodes[i].dataset.selected) {
                            markup.childNodes[i].dataset.selected = "false";
                        }
                        if (markup.childNodes[i].tagName == "rect") {
                            _highlightPdfAnnotationShape(markup.childNodes[i], "rgb(255,0,0)");
                        }
                    }
                    break;
                case "Stamp" :
                    //
                    break;
                case "Highlight" :
                    _highlightPdfAnnotationShape(markup, "rgb(255,171,0)");
                    break;
                case "Underline" :
                    for (var i = 0; i < markup.childNodes.length; i++) {
                        if (markup.childNodes[i].dataset.selected) {
                            markup.childNodes[i].dataset.selected = "false";
                        }
                        if (markup.childNodes[i].tagName == "path") {
                            _highlightPdfAnnotationShape(markup.childNodes[i], "rgb(106,217,38)");
                        }
                    }
                    break;
                default:
                    break;
            }
            _selectedAnnotation = null;
        }
    }
    
    function _highlightPdfAnnotationShape(markup, rgb) {
        markup.style.stroke = rgb;
    }
    
    function _deletePdfAnnotation () {
        if (_selectedAnnotation) {
            var parsedAnno = _getParsedAnnotation(_selectedAnnotation);
            _selectedAnnotation.parentNode.removeChild(_selectedAnnotation);
            var parsedAnnoIndex = _pdfParsedAnnotationSet.indexOf(parsedAnno);
            if (parsedAnnoIndex > -1) {
                _pdfParsedAnnotationSet[parsedAnnoIndex] = null;
            }
            _selectedAnnotation = null;
            document.getElementById(_currentCanvasId).style.cursor = "auto";
        }
    }
    
//PDF SAVE FDF

    function _GetLoadedPdfAnnotationSetFdf (docScene, author, filePath, callback) {
        if (_pdfParsedAnnotationSet && _pdfParsedAnnotationSet.length > 0) {
            var deparsedAnnoSet = _buildUnparsedAnnotationSet(_pdfParsedAnnotationSet);
            if (!author) {
                author = "";
            }
            if (!filePath) {
                filePath = "";
            }
            docScene.GetFdfBufferfromPdfAnnotations(deparsedAnnoSet, author, filePath, function(buffer, errors){
                if (callback) {
                    if (buffer != "") {
                        callback(buffer);
                    } else {
                        console.log(errors);
                    }
                }
            });
        }
    }
    
    function _buildUnparsedAnnotationSet (annoSet) {
        if (!annoSet) {
            return;
        }
        var deparsedAnnoSet = new Module.PdfAnnotationSetVec();
        for (var i = 0; i < annoSet.length; i++) {
            if (annoSet[i] != null) {
                var deparsedAnno = null;
                switch (annoSet[i].type) {
                    case "LeaderLine":
                    case "PolyLine":
                        deparsedAnno = _unparseLeaderLineMarkup(annoSet[i]);
                        break;
                    case "Rectangle":
                    case "Circle" :
                        deparsedAnno = _unparseShapeMarkup(annoSet[i]);
                        break;
                    case "Polygon" :
                        deparsedAnno = _unparsePolygonMarkup(annoSet[i]);
                        break;
                    case "Highlight":
                    case "StrikeThrough":
                    case "Underline":
                    case "Freehand":
                        deparsedAnno = _unparseTextDecorationMarkup(annoSet[i]);
                        break;
                    case "Note":
                        deparsedAnno = _unparseNoteMarkup(annoSet[i]);
                        break;
                    case "Stamp":
                        deparsedAnno = _unparseStampMarkup(annoSet[i]);
                        break;
                    default:
                        break;
                }
                if (deparsedAnno) {
                    deparsedAnnoSet.push_back(deparsedAnno);
                }
            }
        }
        return deparsedAnnoSet;
    }
    
    function _unparseLeaderLineMarkup (markup) {
        var leaderLineObj = {};
        leaderLineObj.type = markup.type;
        leaderLineObj.pageNo = markup.pageNo;
        var data = "Vertices:";
        for (var i = 0; i < markup.vertices.length; i++) {
            data += " " + markup.vertices[i] + ",";
        }
        data += " Bounding box:"
        for (var j = 0; j < markup.boundingBox.length; j++) {
            data += " " + markup.boundingBox[j] + ",";
        }
        data += " Head: " + markup.head + ",";
        data += " Tail: " + markup.tail;
        leaderLineObj.data = data;
        return leaderLineObj;
    }
    
    function _unparseShapeMarkup (markup) {
        var shapeObj = {};
        shapeObj.type = markup.type;
        shapeObj.pageNo = markup.pageNo;
        shapeObj.data = "Vertices:";
        for (var i = 0; i < markup.vertices.length; i++) {
            shapeObj.data += " " + markup.vertices[i] + ",";
        }
        shapeObj.data += " Filled: " + markup.filled;
        return shapeObj;
    }
    
    function _unparsePolygonMarkup (markup) {
        var polygonObj = {};
        polygonObj.type = markup.type;
        polygonObj.pageNo = markup.pageNo;
        polygonObj.data = "Vertices:";
        for (var i = 0; i < markup.vertices.length; i++) {
            polygonObj.data += " " + markup.vertices[i] + ",";
        }
        polygonObj.data += " Bounding box:"
        for (var j = 0; j < markup.boundingBox.length; j++) {
            polygonObj.data += " " + markup.boundingBox[j] + ",";
        }
        polygonObj.data += " Filled: " + markup.filled;
        return polygonObj;
    }
    
    function _unparseTextDecorationMarkup (markup) {
        var textDecoObj = {};
        textDecoObj.type = markup.type;
        textDecoObj.pageNo = markup.pageNo;
        textDecoObj.data = "Vertices:";
        for (var i = 0; i < markup.vertices.length; i++) {
            textDecoObj.data += " " + markup.vertices[i] + ",";
        }
        textDecoObj.data += " Bounding box:"
        for (var j = 0; j < markup.boundingBox.length; j++) {
            textDecoObj.data += " " + markup.boundingBox[j] + ",";
        }
        return textDecoObj;
    }
    
    function _unparseNoteMarkup (markup) {
        var noteObj = {};
        noteObj.type = markup.type;
        noteObj.pageNo = markup.pageNo;
        noteObj.data = "Bounding box:";
        for (var j = 0; j < markup.boundingBox.length; j++) {
            noteObj.data += " " + markup.boundingBox[j] + ",";
        }
        noteObj.data += " Content: " + markup.content;
        noteObj.data += ", Font Family: " + markup.fontFamily;
        noteObj.data += ", Text Alignment: " + markup.textAlignment;
        noteObj.data += ", Font Color: " + markup.fontColor;
        noteObj.data += ", Font Size: " + markup.fontSize.toFixed(6);
        noteObj.data += ", Head: " + markup.head;
        if (markup.leaderLineVertices.length > 0) {
            noteObj.data += ", Leader Line Vertices:";
            for (var j = 0; j < markup.leaderLineVertices.length; j++) {
                noteObj.data += " " + markup.leaderLineVertices[j] + ",";
            }
        }
        return noteObj;
    }
    
    function _unparseStampMarkup (markup) {
        var stampObj = {};
        stampObj.type = markup.type;
        stampObj.pageNo = markup.pageNo;
        stampObj.data = "Vertices:";
        for (var i = 0; i < markup.vertices.length; i++) {
            stampObj.data += " " + markup.vertices[i] + ",";
        }
        stampObj.data += " Filter: " + markup.filter;
        stampObj.data += ", Stream Length: " + markup.streamLength;
        stampObj.data += ", Inflated Length: " + markup.inflatedLength;
        stampObj.data += ", Height: " + markup.height;
        stampObj.data += ", Width: " + markup.width;
        stampObj.data += ", Color Space: " + markup.colorSpace;
        stampObj.data += ", Bits Per Component: " + markup.bitsPerComponent;
        stampObj.data += ", Inflated Stream: " + markup.stream;
        return stampObj;
    }
    
    //PDF PRINT BUFFERS
    
    function _GetPdfPrintBuffers (parent, firstPage, lastPage, width, height, callback) {
        if (!_printEnabled) return;
        
        if (_print && _print.running) {
            if (firstPage == lastPage) {
                _printCallback = {
                    pageNo: firstPage,
                    width: width,
                    height: height,
                    callback: callback
                };
            }
            return;
        }
        if (firstPage == lastPage && _prefetchedPage &&
            _prefetchedPage.pageNo == firstPage &&
            (_prefetchedPage.width >= width || _prefetchedPage.height >= height)) {
            callback([_prefetchedPage]);
            _prefetchedPage = null;
            _getPrintBuffers(parent, firstPage+1, firstPage+1, width, height, true);
        } else {
            _getPrintBuffers(parent, firstPage, lastPage, width, height, false, callback, function() {
                _getPrintBuffers(parent, firstPage+1, firstPage+1, width, height, true);
            });
        }
    }

    function _preparePdfPrintDiv(parent) {
        var printDiv = null;
        if (_printDivTemplate == null) {
            printDiv = document.createElement("div");
            printDiv.id = "PdfPrintDiv";
            printDiv.className = "PdfPrintElement";
            printDiv.style.visibility = "hidden";

            _printDivTemplate = printDiv.cloneNode(false);
        } else {
            printDiv = _printDivTemplate.cloneNode(false);
        }
        parent.appendChild(printDiv);

        return printDiv;
    }

    function _checkPrintCallback(parent) {
        if (_printCallback) {
            if (_printCallback.pageNo == _prefetchedPage.pageNo) {
                _printCallback.callback([_prefetchedPage]);
                var nextPageNo = _prefetchedPage.pageNo+1;
                var width = _printCallback.width;
                var height = _printCallback.height;
                _prefetchedPage = null;
                _printCallback = null;
                
                _getPrintBuffers(parent, nextPageNo, nextPageNo, width, height, true);
            } else {
                _prefetchedPage = null;
                _GetPdfPrintBuffers(parent, _printCallback.pageNo, _printCallback.pageNo, _printCallback.width, _printCallback.height, _printCallback.callback);
            }
        }
    }

    function _getPrintBuffers(parent, firstPage, lastPage, width, height, prefetch, pdfCallback, callback) {
        if (prefetch && (firstPage > __TOTAL_PAGES)) {
            return;
        }

        _print = {running: true};
        var printDiv = _preparePdfPrintDiv(parent);
        _preparePrintStyling();
        _saveCurrentDocCursor();
        _getPrintBuffersZoomScale(width, height, firstPage, lastPage, function(zoomScale){
            _populatePrintDiv(printDiv, zoomScale, firstPage, lastPage, function(){
                if (firstPage == null) {
                    firstPage = 1;
                }
                if (lastPage == null) {
                    lastPage = __TOTAL_PAGES;
                }
                if (firstPage > lastPage) {
                    var tempPage = firstPage;
                    firstPage = lastPage;
                    lastPage = tempPage;
                }
                firstPage = Math.min(Math.max(firstPage, 1), __TOTAL_PAGES);
                lastPage = Math.max(Math.min(lastPage, __TOTAL_PAGES), 1);
                var bufferArray = [];
                _generatePdfPrintBuffers(firstPage, lastPage, bufferArray, function() {
                    if (prefetch) {
                        _prefetchedPage = bufferArray[0];
                        _getPdfPrintBuffersCallback();
                        _checkPrintCallback(parent);
                    } else {
                        _getPdfPrintBuffersCallback(bufferArray, pdfCallback);
                        callback();
                    }
                });
            });
        });
    }

    function _handleNextPrintPage(pageNo, lastPage, result, callback) {
        if (pageNo >= lastPage) {
            if (callback) {
                callback();
            }
        } else {
            _generatePdfPrintBuffers(pageNo+1, lastPage, result, callback);
        }
    }

    function _generatePdfPrintBuffers(pageNo, lastPage, result, callback) {
        var printPage = document.getElementById("PdfPrintPage" + pageNo);
        if (printPage) {
            var pageContext = printPage.getContext('2d');
            var markupDiv = document.getElementById("PdfPrintAnnotationCanvas" + (pageNo-1));
            if (markupDiv) {
                var imgList = markupDiv.getElementsByTagName("IMG");
                var imgArray = Array.from(imgList);
                for (var i=0;i<imgArray.length;i++) {
                    pageContext.drawImage(
                        imgArray[i],
                        parseInt(imgArray[i].style.left), parseInt(imgArray[i].style.top),
                        parseInt(imgArray[i].style.width), parseInt(imgArray[i].style.height)
                    );
                }

                var svgList = markupDiv.getElementsByTagName("svg");
                if (svgList.length) {
                    var svgArray = Array.from(svgList);
                    _drawSvgImages(svgArray, printPage, function() {
                        result.push(_getPdfPageBufferFromContext(printPage));
                        _handleNextPrintPage(pageNo, lastPage, result, callback);
                    });
                } else {
                    result.push(_getPdfPageBufferFromContext(printPage));
                    _handleNextPrintPage(pageNo, lastPage, result, callback);
                }
            } else {
                result.push(_getPdfPageBufferFromContext(printPage));
                _handleNextPrintPage(pageNo, lastPage, result, callback);
            }
        } else {
            _handleNextPrintPage(pageNo, lastPage, result, callback);
        }
    }

    function _drawSvgImages(list, canvas, callback) {
        var svg = list.shift();
        if (svg) {
            var svgImg = new Image();
            var svgXml = new XMLSerializer().serializeToString(svg);
            svgImg.src = "data:image/svg+xml;base64," + btoa(svgXml);
            svgImg.onload = function() {
                canvas.getContext("2d").drawImage(svgImg, 0, 0);
                _drawSvgImages(list, canvas, callback);
            }
        } else {
            callback();
        }
    }

    function _getPdfPageBufferFromContext (printPage) {
        return {
            width:  parseInt(printPage.width),
            height: parseInt(printPage.height),
            pageNo: parseInt(printPage.id.substring("PdfPrintPage".length)),
            png:    printPage.toDataURL()
        };
    }

    function _getPdfPrintBuffersCallback (bufferArray, callback) {
        _removePdfPrintDiv();
        document.body.style.cursor = _printDocCursor;
        if (callback) {
            callback(bufferArray);
        }
    }

    function _getPrintBuffersZoomScale(width, height, firstPage, lastPage, callback) {
        if (width == null || height == null) {
            if (callback) {
                callback(150/72);
                return;
            }
        }
        var pageWidth = 0;
        var pageHeight = 0;
        _getLargestPrintWidthAndHeight(firstPage, pageWidth, pageHeight, lastPage, function(maxHeightWidthObj){
            var heightZoom = height / maxHeightWidthObj.maxPageHeight;
            var widthZoom = width / maxHeightWidthObj.maxPageWidth;
            if (callback) {
                callback(Math.min(heightZoom, widthZoom));
                return;
            }
        });
    }

    function _getLargestPrintWidthAndHeight(pageNo, pageWidth, pageHeight, lastPage, callback) {
        if (pageNo > lastPage) {
            if (callback){
                callback({maxPageWidth: pageWidth, maxPageHeight: pageHeight});
            }
        } else {
            __PDF_DOC.getPage(pageNo).then(function(page){
                var viewport = page.getViewport(1);
                pageWidth = Math.max(pageWidth, parseInt(viewport.width));
                pageHeight = Math.max(pageHeight, parseInt(viewport.height));
                _getLargestPrintWidthAndHeight(pageNo+1, pageWidth, pageHeight, lastPage, callback);
            });
        }
    }

//PDF FILTER MARKUPS

    function _setPdfMarkupsFilter (filterOn) {
        _filterPdfMarkups = filterOn;
        if (_pdfParsedAnnotationSet && _pdfParsedAnnotationSet.length != 0) {
            var markupCanvases = document.getElementsByClassName("PdfAnnotationCanvas");
            var canvasVisibility = _filterPdfMarkups ? "hidden" : "visible";
            for (var i = 0; i < markupCanvases.length; i++) {
                markupCanvases[i].style.visibility = canvasVisibility;
            }
        }
    }
})();