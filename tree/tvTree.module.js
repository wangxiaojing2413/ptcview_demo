angular.
    module('tree', []).
    directive('tvTree', function() {
        return {
            restrict: 'AE',
            transclude: true,
            templateUrl: 'tree/tvTree.template.html'
        };
    }).
    controller('tvTreeController', ['$scope', '$rootScope', '$element', function($scope, $rootScope, $element) {

        // variables
        // $scope.tvTree = null;
        // $scope.uiTree = null;
        $scope.ignoreFeaturePopulate = 0;

        // events
        // structure tree
        $rootScope.$on('ParseTreeAddMessage', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                $scope.ParseTreeAddMessage(args.message);
            }
        });
        $rootScope.$on('ParseTreeRemoveMessage', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                $scope.ParseTreeRemoveMessage(args.message);
            }
        });
        $rootScope.$on('ParseTreeUpdateMessage', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                $scope.ParseTreeUpdateMessage(args.message);
            }
        });
        $rootScope.$on('ApplyNodeSelectionList', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                $scope.ApplyNodeSelectionList();
            }
        });
        $rootScope.$on('ExpandChildren', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                $scope.ExpandChildren(args.message);
            }
        });
        $rootScope.$on('ClearTree', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                if ($scope.uiTree) {
                    $scope.uiTree = null;
                }
            }
        });
        $rootScope.$on('UpdateTreeSelection', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                $scope.UpdateTreeSelection();
            }
        });

        // model annotations
        $rootScope.$on('PopulateModelAnnotations', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                if ($scope.ignoreFeaturePopulate) {
                    --$scope.ignoreFeaturePopulate;
                    return;
                }

                if ($scope.FeaturePartSelectionChanged($scope.uiTree, args.message)) {
                    $scope.uiTree = args.message;
                    $scope.GenerateTreeNodes();
                }
            }
        });
        $rootScope.$on('ClearFeatureSelection', function(event, args) {
            if ($element[0].parentElement.className.indexOf(args.class) != -1) {
                $scope.ClearFeatureSelection();
            }
        });

        // functions
        $scope.ParseTreeAddMessage = function(messageArr) {
            var updates = [];
            for (var i = 0; i < messageArr.length; i++) {
                var message_obj = JSON.parse(messageArr[i]);
                console.log(message_obj)

                if (message_obj.treeMapping) {
                    for (var v=0;v<message_obj.treeMapping.length;++v) {
                        updates.push(message_obj.treeMapping[v]);
                    }
                }
            }

            if (updates.length) {
                // Add instances
                updates.sort(function(a, b) {
                    return parseInt(a.id, 10) - parseInt(b.id, 10);
                });
                $scope.AddInstances(updates);//初始化idpathMap中数据
            }
        }

        $scope.ParseTreeRemoveMessage = function(messageArr) {
            var updates = [];
            for (var i = 0; i < messageArr.length; i++) {
                var message_obj = JSON.parse(messageArr[i]);

                if (message_obj.treeRemove) {
                    for (var v=0;v<message_obj.treeRemove.length;++v) {
                        updates.push(message_obj.treeRemove[v]);
                    }
                }
            }

            if (updates.length) {
                // Remove instances
                updates.sort(function(a, b) {
                    return parseInt(b.id, 10) - parseInt(a.id, 10);
                });
                $scope.RemoveInstances(updates);
            }
        }

        $scope.ParseTreeUpdateMessage = function(messageArr) {
            var updates = [];
            var updateChanges = [];

            for (var i = 0; i < messageArr.length; i++) {
                var message_obj = JSON.parse(messageArr[i]);

                if (message_obj.treeUpdate) {
                    for (var v=0;v<message_obj.treeUpdate.length;++v) {
                        updates.push(message_obj.treeUpdate[v]);
                    }
                } else if (message_obj.treeUpdateChanges) {
                    for (var v=0;v<message_obj.treeUpdateChanges.length;++v) {
                        updateChanges.push(message_obj.treeUpdateChanges[v]);
                    }
                }

            }

            if (updates.length) {
                // Update visibility of instances
                updates.sort(function(a, b) {
                    return parseInt(b.id, 10) - parseInt(a.id, 10);
                });
                $scope.UpdateInstances(updates);

            } else if (updateChanges.length) {
                // Update visibility of instances
                updateChanges.sort(function(a, b) {
                    return parseInt(b.id, 10) - parseInt(a.id, 10);
                });
                $scope.UpdateInstances(updateChanges);
            }
        }

        $scope.ExpandChildren = function(expand) {
            for (var i=0; i<$scope.nodeSelection.length; i++) {
                var node = $scope.idpathMap[$scope.nodeSelection[i]];
                if (node) {
                    $scope.ExpandChildNodes(node, expand);
                }
            }
        }
        $scope.ExpandChildNodes = function(node, expand) {
            if (node.children.length) {
                if (expand) {
                    node.expanded = true;
                } else {
                    node.expanded = false;
                }

                for (var i=0; i<node.children.length; i++) {
                    $scope.ExpandChildNodes($scope.uidMap[node.children[i]], expand);
                }
            }
        }

        $scope.UpdateTreeSelection = function() {
            if ($scope.nodeSelection.length > 0) {
                for (let i=0; i<$scope.nodeSelection.length; i++) {
                    let ancestorArr = [];
                    let foundNode = $scope.idpathMap[$scope.nodeSelection[i]];
                    if (foundNode) {
                        let parentNode = $scope.uidMap[foundNode.parent];
                        while (parentNode) {
                            if (parentNode.data.uid == "0") break;
                            ancestorArr.push(Number(parentNode.data.uid));

                            parentNode = $scope.uidMap[parentNode.parent];
                        }

                        ancestorArr.sort(function(a, b) {
                            return parseInt(a, 10) - parseInt(b, 10);
                        });

                        if ($scope.uiTree) {
                            let uiTreeNode = $scope.uiTree[0];
                            for (let j=0; j<ancestorArr.length; j++)
                            {
                                let uidStr = ancestorArr[j].toString();
                                if (uiTreeNode.uid != uidStr) break;

                                let node = $scope.uidMap[uidStr];
                                if (node != undefined) {
                                    if (uiTreeNode.children.length == 0) {
                                        for (let k=0; k<node.children.length; k++) {
                                            let objItem = new Object();
                                            objItem.uid = node.children[k];
                                            objItem.children = [];
                                            objItem.parent = uiTreeNode;
                                            uiTreeNode.children.push(objItem);
                                            $scope.uidMap[node.children[k]].uiNode = objItem;
                                        }
                                        node.uiNode = uiTreeNode;
                                    }
                                }
                                node.expanded = true;

                                let childUid = ancestorArr[j+1];
                                if (childUid != undefined) {
                                    let childUidStr = childUid.toString();

                                    for (let k=0; k<uiTreeNode.children.length; k++) {
                                        if (uiTreeNode.children[k].uid == childUidStr) {
                                            uiTreeNode = uiTreeNode.children[k];
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                $scope.DelayedApply(100, function() {
                    if ($scope.nodeSelection.length == 1) {
                        let node = $scope.idpathMap[$scope.nodeSelection[0]];
                        if (node) {
                            let tree = document.getElementById('treeApp')
                            let selNode = document.getElementById('SUID' + node.data.uid);

                            if (tree && selNode) {
                                let treeRect = tree.getBoundingClientRect();
                                let selNodeRect = selNode.getBoundingClientRect();
                                if (treeRect && selNodeRect) {
                                    if (selNodeRect.bottom > treeRect.bottom) {
                                        if (tree.scrollWidth > treeRect.width) {
                                            tree.scrollTop += selNodeRect.bottom - treeRect.bottom + 12;
                                        } else {
                                            tree.scrollTop += selNodeRect.bottom - treeRect.bottom + 2;
                                        }
                                    } else if (selNodeRect.top < treeRect.top) {
                                        tree.scrollTop -= treeRect.top - selNodeRect.top - 2;
                                    }

                                    if (selNodeRect.right > treeRect.right) {
                                        if (tree.scrollHeight > treeRect.height) {
                                            tree.scrollLeft += selNodeRect.right - treeRect.right + 12;
                                        } else {
                                            tree.scrollLeft += selNodeRect.right - treeRect.right + 2;
                                        }
                                    } else if (selNodeRect.left < treeRect.left) {
                                        tree.scrollLeft -= treeRect.left - selNodeRect.left - 2;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        $scope.ApplyNodeSelectionList = function() {
            //$scope.DeselectAll(Module.SelectionList.PRIMARYSELECTION);
            if ($scope.model) {
                for (var i=0; i<$scope.nodeSelection.length; i++) {
                    $scope.model.SelectPart($scope.nodeSelection[i], true, Module.SelectionList.PRIMARYSELECTION);
                }
            }
        }

        $scope.AddInstances = function(messages) {
            for (var i = 0; i < messages.length; i++) {
                var uid = messages[i].id;
                var idpath = messages[i].idpath;
                var name = messages[i].name;
                var vis = Number(messages[i].state);
                var icon = Number(messages[i].image);
                //var strippedIdpath = $scope.StripModelIdFromIdPath(idpath);
                var modelId = GetModelId(idpath);
                $scope.SetCurrentModel(modelId);
                debugger;
                if ($scope.structure) {
                    //var name = $scope.structure.GetInstanceName(strippedIdpath)
                    var fullIdpath = PrependModelId(idpath, $scope.model.id);
                    if (idpath == ':') {
                        // Create new tree
                        if (!$scope.tvTree) {
                            $scope.tvTree = new Tree(new Data(uid, fullIdpath, name));
                            //$scope.uiTree = [{uid: uid, children: []}];
                            $scope.uidMap[uid] = $scope.tvTree._root;
                            $scope.idpathMap[fullIdpath] = $scope.tvTree._root;
                            $scope.tvTree.UpdateNodeVisiblity($scope.uidMap[uid], vis);
                            $scope.tvTree.UpdateNodeIcon($scope.uidMap[uid], icon);
                        }
                    } else {
                        // Add children
                        if ($scope.uidMap[uid] === undefined) {
                            if (!$scope.uiTree) {
                                $scope.uiTree = [{uid: uid, children: []}];
                            }
                            var node = $scope.tvTree.AddNode(new Data(uid, fullIdpath, name));
                            $scope.tvTree.UpdateNodeVisiblity($scope.uidMap[uid], vis);
                            $scope.tvTree.UpdateNodeIcon($scope.uidMap[uid], icon);
                        }
                    }
                } else {
                    if (uid == '0') {
                        // Root
                        if ($scope.uidMap[uid] != undefined) {
                            $scope.tvTree.UpdateNodeVisiblity($scope.uidMap[uid], vis);
                            $scope.tvTree.UpdateNodeIcon($scope.uidMap[uid], icon);
                        }
                    }
                }
            }
        }

        $scope.RemoveInstances = function(messages) {
            for (var i = 0; i < messages.length; i++) {
                var uid = messages[i].id;
                var node = $scope.uidMap[uid];
                if (node != undefined) {
                    $scope.tvTree.RemoveNode(node);
                }
            }
        }

        $scope.UpdateInstances = function(messages) {
            for (var i = 0 ; i < messages.length; i++) {
                var uid = messages[i].id;
                if ($scope.uidMap[uid] != undefined) {
                    var state = messages[i].state;
                    if (state != undefined) {
                        $scope.tvTree.UpdateNodeVisiblity($scope.uidMap[uid], Number(state));
                    }

                    var image = messages[i].image;
                    if (image != undefined) {
                        $scope.tvTree.UpdateNodeIcon($scope.uidMap[uid], Number(image));
                    }
                }
            }
        }

        $scope.ParseTreeMappingMessage = function(messageArr) {
            var mappings = [];
            for (var i = 0; i < messageArr.length; i++) {
                var message_obj = JSON.parse(messageArr[i]);

                for (var v=0;v<message_obj.treeMapping.length;++v)
                    mappings.push(message_obj.treeMapping[v]);
            }
            mappings.sort(function(a, b) {
                return parseInt(a.id, 10) - parseInt(b.id, 10);
            });

            for (var j = 0; j < mappings.length; j++) {
                var uid = mappings[j].id;
                var idpath = mappings[j].idpath;
                var strippedIdpath = $scope.StripModelIdFromIdPath(idpath);
                var modelId = GetModelId(idpath);
                $scope.SetCurrentModel(modelId);
                if ($scope.structure) {
                    var name = $scope.structure.GetInstanceName(strippedIdpath)
                    var fullIdpath = PrependModelId(idpath, $scope.model.id);
                    if (idpath == ':') {
                        // Create new tree
                        if (!$scope.tvTree) {
                            $scope.tvTree = new Tree(new Data(uid, fullIdpath, name));
                            $scope.uidMap[uid] = $scope.tvTree._root;
                            $scope.idpathMap[fullIdpath] = $scope.tvTree._root;
                        }
                    } else {
                        // Add children
                        var node = $scope.tvTree.AddNode(new Data(uid, fullIdpath, name));
                    }
                }
            }

            $scope.tvTree._root.expanded = false;
        }

        $scope.FeaturePartSelectionChanged = function(oldTree, newTree) {
            if (!oldTree) return true;
            if (oldTree.length != newTree.length) return true;

            var oldIdpaths = [];
            var newIdpaths = [];

            for (var i=0; i<oldTree.length; i++) {
                var oldidpath = oldTree[i].idpath;
                var n = oldidpath.indexOf('|');
                if (n != -1)
                    oldidpath = oldidpath.substr(0, n);
                oldIdpaths.push(oldidpath);
            }

            for (var i=0; i<newTree.length; i++) {
                newIdpaths.push(newTree[i].idpath);
            }


            for (var i=0; i<oldIdpaths.length; i++) {
                var n = newIdpaths.indexOf(oldIdpaths[i]);
                if (n != -1) {
                    newIdpaths.splice(n, 1);
                }
            }

            if (newIdpaths.length != 0) return true;

            return false;
        }

        $scope.GenerateTreeNodes = function() {
            for (var i=0; i<$scope.uiTree.length; i++) {
                $scope.AddTreeNode($scope.uiTree[i]);
            }
        }

        $scope.AddTreeNode = function(item, parentIdpath, index) {
            if (item.image != 0) {
                var idpath;
                if (index != undefined) {
                    idpath = '|' + index + '_' + item.id + '_' + item.name;
                } else {
                    idpath = '|' + item.id + '_' + item.name;
                }
                
                if (parentIdpath) {
                    idpath = parentIdpath + idpath;
                } else {
                    idpath = item.idpath + idpath;
                }
                item.idpath = idpath;
                var objItem = new Object();
                objItem.expanded = false;
                $scope.uidMap[item.idpath] = objItem;

                if (item.children) {
                    for (var i=0; i<item.children.length; i++) {
                        var child = $scope.AddTreeNode(item.children[i], idpath, i);
                        if (child) {
                            child.parent = objItem;
                        }
                    }
                }

                return objItem;
            }

            return undefined;
        }

        $scope.GetTreeElementStyle = function(item) {
            var c = document.createElement('canvas');
            var ctx = c.getContext('2d');
            ctx.font = "12px 'Arial', Sans-serif";

            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                var length = ctx.measureText(node.data.name).width + 70;
                var resStr = length.toString();
                return {
                    'width':resStr
                }
            } else {
                var length = ctx.measureText(item.name).width + 70;
                var resStr = length.toString();
                return {
                    'width':resStr
                }
            }
        }

        $scope.GetUID = function(item) {
            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                return true;
            } else {
                return false;
            }
        }

        $scope.GetId = function(prefix, item) {
            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                var res = prefix + item.uid;
                return res;
            } else {
                var res = prefix + item.idpath;
                return res;
            }
        }

        $scope.GetCheckState = function(item) {
            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                var id = 'UID' + item.uid;
                if (node.visible === 'CHECKED') {
                    document.getElementById(id).indeterminate = false;
                    document.getElementById(id).checked = true;
                } else if (node.visible === 'PARTIAL') {
                    document.getElementById(id).indeterminate = true;
                } else { // 'UNCHECKED'
                    document.getElementById(id).indeterminate = false;
                    document.getElementById(id).checked = false;
                }
            }
        }

        $scope.GetChildrenSize = function(item) {
            var node = $scope.uidMap[item.uid];
            var res;
            if (node != undefined) {
                res = node.children.length;
            } else {
                if (item.children) {
                    res = item.children.length;
                }
            }

            return res;
        }

        $scope.emptySpanStyle = {
            'padding-left':'15.5px'
        };

        $scope.GetEmptySpanStyle = function() {
            return $scope.emptySpanStyle;
        }


        $scope.pngAssembly = "./icons/assembly.png";
        $scope.pngAssemblyBranchLink = "./icons/assembly_branch_link.png";
        $scope.pngInstanceLoaded = "./icons/instance_loaded.png";
        $scope.pngInstanceUnloaded = "./icons/instance_unloaded.png";
        $scope.pngInstanceBranchLink = "./icons/instance_branch_link.png";

        $scope.pngFeaturePart = "./icons/feature_part.png";
        $scope.pngFeatureDimension = "./icons/feature_dimension.png";
        $scope.pngFeatureNonDatumParent = "./icons/feature_non_datum_parent.png";
        $scope.pngFeatureTolerance = "./icons/feature_tolerance.png";
        $scope.pngFeatureSetDatum = "./icons/feature_set_datum.png";
        $scope.pngFeatureSymbol = "./icons/feature_symbol.png";
        $scope.pngFeatureNote = "./icons/feature_note.png";
        $scope.pngFeatureDatumParent = "./icons/feature_datum_parent.png";
        $scope.pngFeatureFace = "./icons/feature_face.png";
        $scope.pngFeatureSurfaceFinish = "./icons/feature_surface_finish.png";


        $scope.GetIconSrc = function(item) {
            if (item == undefined) return;

            var node = $scope.uidMap[item.uid];

            if (node != undefined) {
                if (node.icon == 0) {
                    return $scope.pngAssembly;
                } else if (node.icon == 1) {
                    return $scope.pngInstanceLoaded;
                } else if (node.icon == 2) {
                    return $scope.pngInstanceUnloaded;
                } else if (node.icon == 4) {
                    return $scope.pngAssemblyBranchLink;
                } else if (node.icon == 6) {
                    return $scope.pngInstanceBranchLink;
                }
            } else {
                if (item.image == "1") {
                    return $scope.pngAssembly;
                } else if (item.image == "2") {
                    return $scope.pngFeaturePart;
                } else if (item.image == "3") {
                    return $scope.pngFeatureDatumParent;
                } else if (item.image == "4") {
                    return $scope.pngFeatureNonDatumParent;
                } else if (item.image == "5") {
                    return $scope.pngFeatureSymbol;
                } else if (item.image == "7") {
                    return $scope.pngFeatureDimension;
                } else if (item.image == "9") {
                    return $scope.pngFeatureSurfaceFinish;
                } else if (item.image == "11") {
                    return $scope.pngFeatureNote;
                } else if (item.image == "17") {
                    return $scope.pngFeatureSetDatum;
                } else if (item.image == "23") {
                    return $scope.pngFeatureTolerance;
                } else if (item.image == "25") {
                    return $scope.pngFeatureFace;
                }
            }
        }

        $scope.iconStyle = {
            'width':'15px',
            'height':'15px',
            'vertical-align':'middle',
            'margin-left':'0px'
        };

        $scope.GetIconStyle = function() {
            return $scope.iconStyle;
        }

        $scope.blockDisplayStyle = {
            'display':'block'
        };

        $scope.noneDisplayStyle = {
            'display':'none'
        };

        $scope.GetLiStyle = function(item) {
            if (item == undefined) return;

            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                var parent = $scope.uidMap[node.parent];
                if (parent) {
                    if (parent.expanded == true) {
                        return $scope.blockDisplayStyle;
                    } else {
                        return $scope.noneDisplayStyle;
                    }
                }
            } else {
                var element = $scope.uidMap[item.idpath];
                if (element != undefined) {
                    if (element.parent) {
                        if (element.parent.expanded == true) {
                            return $scope.blockDisplayStyle;
                        } else {
                            return $scope.noneDisplayStyle;
                        }
                    }
                }
            }
        }

        $scope.GetChildren = function(item) {
            if (item == undefined) return;

            var node = $scope.uidMap[item.uid];
            var res;
            if (node != undefined) {
                res = node.children;
            }

            return res;
        }

        $scope.GetNodeName = function(item) {
            if (item == undefined) return;

            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                let name = decode_utf8(node.data.name);
                return name;
            } else {
                if (item.name) {
                    let name = decode_utf8(item.name);
                    return name;
                }
                return "";
            }
        }

        $scope.GetMarkupId = function(item) {
            if (item == undefined) return;

            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                return node.data.markupId;
            } else {
                if (item.markupId) {
                    return item.markupId;
                }
                return "";
            }
        }

        $scope.selInstStyle = {
            'padding-top':'2px',
            'padding-bottom':'2px',
            'background':'#B0E4FE',
            'cursor':'default',
            'vertical-align':'middle',
            'font-size':'12px'
        };

        $scope.noselInstStyle = {
            'padding-top':'2px',
            'padding-bottom':'2px',
            'background':'#FFFFFF',
            'cursor':'default',
            'vertical-align':'middle',
            'font-size':'12px'
        };

        $scope.GetLabelStyle = function(item) {
            if (item == undefined) return;

            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                var idpath = node.data.idpath
                var i = $scope.nodeSelection.indexOf(idpath);
                if (i != -1) { // found
                    return $scope.selInstStyle;
                } else {
                    return $scope.noselInstStyle;
                }
            } else {
                if (item.idpath) {
                    var n = item.idpath.indexOf('|');
                    if (n != -1) {
                        var idPath = item.idpath.substr(0, n);
                        var features = $scope.featureSelection[idPath];
                        if (features) {
                            var i = features.indexOf(Number(item.id));
                            if (i != -1) {
                                return $scope.selInstStyle;
                            }
                        }
                    }
                }

                return $scope.noselInstStyle;
            }
        }

        $scope.GetItemDraggable = function(item) {
            return $scope.GetUIDDraggable(item.uid);
        }

        $scope.GetUIDDraggable = function(uid) {
            if ($scope.StructureEditOn()) {
                var node = $scope.uidMap[uid];
                if (node != undefined) {
                    var idpath = node.data.idpath;
                    var i = $scope.nodeSelection.indexOf(idpath);
                    if (i != -1) {
                        return true;
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }

        $scope.TreeNodeDblClicked = function(event, item) {
            if ($scope.tvTree) {
                var node = $scope.uidMap[item.uid];
                if (node != undefined) {
                    if (event.ctrlKey) {
                        var i = $scope.nodeSelection.indexOf(node.data.idpath);
                        if (i != -1) {
                            $scope.nodeSelection.splice(i, 1);
                            $scope.SetCurrentModel(node.data.modelId);
                            if ($scope.model) {
                                var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                                $scope.model.SelectPart(strippedIdpath, false, Module.SelectionList.PRIMARYSELECTION);
                            }
                        } else {
                            $scope.nodeSelection.push(node.data.idpath);
                            $scope.SetCurrentModel(node.data.modelId);
                            if ($scope.model) {
                                var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                                $scope.model.SelectPart(strippedIdpath, true, Module.SelectionList.PRIMARYSELECTION);
                            }
                        }
                        $scope.lastSelIdpath = node.data.idpath;
                    }
                }
            }

            $scope.ZoomSelected();

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
        }

        $scope.IsValid = function(item) {
            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                return true;
            } else {
                if (item.image != "0") {
                    if (item.children) {
                        if ($scope.HasShowableChildren(item.children)) {
                            return true;
                        } else {
                            return false;
                        }

                    }

                    if (item.image == "25") { // Face
                        if ($scope.showFeatureFaces) {
                            return true;
                        }
                    } else {
                        if ($scope.showFeatureMarkups) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        $scope.HasShowableChildren = function(items) {
            var viewables = items.length;
            for (var i=0; i<items.length; i++) {
                if (items[i].children) {
                    return true;
                } else {
                    if (items[i].image == "0") {
                        viewables--;
                    } else if (items[i].image == "25") {
                        if (!$scope.showFeatureFaces) {
                            viewables--;
                        }
                    } else {
                        if (!$scope.showFeatureMarkups) {
                            viewables--;
                        }
                    }

                    if (viewables == 0) {
                        return false;
                    }
                }
            }

            return true;
        }

        $scope.TreeNodeClicked = function(event, item) {
            console.log(item)
            if ($scope.tvTree) { // structure
                var node = $scope.uidMap[item.uid];
                if (node != undefined) {
                    if (event.ctrlKey) {
                        // Check node is in nodeSelection list
                        var i = $scope.nodeSelection.indexOf(node.data.idpath);
                        if (i != -1) {
                            $scope.nodeSelection.splice(i, 1);
                            $scope.SetCurrentModel(node.data.modelId);
                            if ($scope.model) {
                                var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                                $scope.model.SelectPart(strippedIdpath, false, Module.SelectionList.PRIMARYSELECTION);
                            }
                        } else {
                            $scope.nodeSelection.push(node.data.idpath);
                            $scope.SetCurrentModel(node.data.modelId);
                            if ($scope.model) {
                                var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                                $scope.model.SelectPart(strippedIdpath, true, Module.SelectionList.PRIMARYSELECTION);
                            }
                        }
                        $scope.lastSelIdpath = node.data.idpath;
                    } else if (event.shiftKey) {
                        if ($scope.lastSelIdpath == "") return;

                        var lastSelNode = $scope.idpathMap[$scope.lastSelIdpath];

                        $scope.ClearNodeSelection();
                        var no1 = Number(node.data.uid);
                        var no2 = Number(lastSelNode.data.uid);

                        var startUid, endUid;
                        if (no1 < no2) {
                            startUid = no1;
                            endUid = no2;
                        } else if (no1 > no2) {
                            startUid = no2;
                            endUid = no1;
                        }

                        for (var i = startUid; i <= endUid; i++) {
                            var selNode = $scope.uidMap[i];
                            if (selNode != undefined) {
                                $scope.nodeSelection.push(selNode.data.idpath);
                                var strippedIdpath = $scope.StripModelIdFromIdPath(selNode.data.idpath);
                                $scope.SetCurrentModel(GetModelId(selNode.data.idpath));
                                if ($scope.model) {
                                    $scope.model.SelectPart(strippedIdpath, true, Module.SelectionList.PRIMARYSELECTION);
                                }
                            }
                        }
                    } else {
                        $scope.ClearNodeSelection();
                        $scope.nodeSelection.push(node.data.idpath);
                        $scope.SetCurrentModel(node.data.modelId);
                        if ($scope.model) {
                            var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                            $scope.model.SelectPart(strippedIdpath, true, Module.SelectionList.PRIMARYSELECTION);
                        }
                        $scope.lastSelIdpath = node.data.idpath;
                    }

                    if ($scope.StructureEditOn()) {
                        $scope.MarkComps();
                    }
                } else {
                    $scope.DeselectAll(Module.SelectionList.PRIMARYSELECTION);
                }
            } else { // model annotations
                if ($scope.model) {
                    if (event.ctrlKey) {
                        if (item.id == "0") {
                            // no way to highlight parent node of feature tree so ignore it for now
                            return;
                        }

                        var n = item.idpath.indexOf('|');
                        if (n != -1) {
                            var idPath = item.idpath.substr(0, n);
                            var id = Number(item.id);
                            $scope.model.SelectFeature(idPath, id, !$scope.CheckModelAnnotationSelected(idPath, id));
                        }
                    } else if (event.shiftKey) {
                        // Do nothing yet
                    } else {
                        // Select picked model annotation
                        var n = item.idpath.indexOf('|');
                        if (n != -1) {
                            var idPath = item.idpath.substr(0, n);
                            var idPathArr = new Module.VectorNumber();
                            $scope.AddValidItemId(item, idPathArr);

                            $scope.model.SetFeatureSelection(idPath, idPathArr);
                        }
                    }
                }
            }

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
        }

        $scope.CheckModelAnnotationSelected = function(idpath, id) {
            var features = $scope.featureSelection[idpath];
            if (features) {
                var n = features.indexOf(id);
                if (n != -1) return true;
            }
            return false;
        }

        $scope.ClearFeatureSelection = function() {
            if ($scope.uiTree) {
                var idpath = $scope.uiTree[0].idpath;
                var n = idpath.indexOf('|');
                if (n != -1) {
                    idpath = idpath.substr(0, n);

                    if ($scope.model) {
                        var idPathArr = new Module.VectorNumber();
                        $scope.model.SetFeatureSelection(idpath, idPathArr);
                    }
                }
            }
        }

        $scope.DeselectAllModelAnnotations = function(self) {
            var keys = Object.keys($scope.featureSelection);
            if (keys.length) {
                for (var i=0; i<keys.length; i++) {
                    var features = $scope.featureSelection[keys[i]];
                    if (features) {
                        for (var j=0; j<features.length; j++) {
                            ++$scope.ignoreFeaturePopulate;
                            $scope.model.SelectFeature(keys[i], features[j], false);
                        }
                    }
                }
            } else {
                if (self) {
                    ++$scope.ignoreFeaturePopulate;
                }
            }
        }

        $scope.AddValidItemId = function(item, array) {
            if (item.id != "0") {
                if (item.image == "25") {
                    if ($scope.showFeatureFaces) {
                        array.push_back(Number(item.id));
                    }
                } else {
                    if ($scope.showFeatureMarkups) {
                        array.push_back(Number(item.id));
                    }
                }
            }

            if (item.children) {
                for (var i=0; i<item.children.length; i++) {
                    $scope.AddValidItemId(item.children[i], array);
                }
            }
        }

        $scope.SetCheckState = function(event, item) {
            //JSON format {"primaryNode": "2","selectedNodes": [3,44,25,16] }
            if ($scope.tvTree) {
                var uidArr = new Array($scope.nodeSelection.length);
                for (var i=0; i<$scope.nodeSelection.length; i++) {
                    var foundNode = $scope.idpathMap[$scope.nodeSelection[i]];
                    if (foundNode) {
                        uidArr[i] = foundNode.data.uid.toString();
                    }
                }

                var json_obj = new Object();
                json_obj.primaryNode = item.uid.toString();
                var i = uidArr.indexOf(item.uid.toString());
                if (i != -1) {
                    json_obj.selectedNodes = uidArr;
                } else {
                    json_obj.selectedNodes = null;
                }

                var json_string = JSON.stringify(json_obj);
                console.log(json_string)
                //json_string = '{"primaryNode":"3","selectedNodes":null}';
                $scope.session.SelectTreeNodes(json_string, true);
                /*console.log(json_string)
                window.open('http://localhost/simple-example.html','_blank');*/
                // if ($scope.showProgress == "YES") {
                //     $scope.timer = $timeout(function () {
                //         $scope.session.ShowProgress(true);
                //     }, 250);
                // }
            }

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
        }

        $scope.SetCollapseState = function(event, item) {
            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                if (node.expanded == true) {
                    node.expanded = false;
                } else {
                    node.expanded = true;
                    if (item.children.length == 0) {
                        // Add child nodes
                        $scope.AddUITreeNode(item);
                    }
                }
            } else {
                var element = $scope.uidMap[item.idpath];
                if (element != undefined) {
                    if (element.expanded == true) {
                        element.expanded = false;
                    } else {
                        element.expanded = true;
                    }
                }
            }

            if (event) {
                event.stopPropagation();
            }
        }

        $scope.GetExapandState = function(item) {
            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                if (node.expanded == true) {
                    return true;
                } else {
                    return false;
                }
            } else {
                var element = $scope.uidMap[item.idpath];
                if (element != undefined) {
                    if (element.expanded == true) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }

        $scope.AddUITreeNode = function(item) {
            var node = $scope.uidMap[item.uid];
            if (node != undefined) {
                for (var i=0; i<node.children.length; i++) {
                    var objItem = new Object();
                    objItem.uid = node.children[i];
                    objItem.children = [];
                    objItem.parent = item;
                    item.children.push(objItem);
                    $scope.uidMap[node.children[i]].uiNode = objItem;
                }
                node.uiNode = item;
            }
        }

        $scope.SEDragDrop = function(uid) {
            var se = $scope.session.GetStructureEdit();
            if (se) {
                var id = uid.substr(3);
                var node = $scope.uidMap[id];
                if (node != undefined) {
                    $scope.SetCurrentModel(node.data.modelId);
                    if ($scope.model) {
                        var strippedIdpath = $scope.StripModelIdFromIdPath(node.data.idpath);
                        var newIds = Module.StringMap.Create();
                        se.MoveComps($scope.markedComps, strippedIdpath, true, true, newIds, function (success, movedIds) {
                            if (success) {
                                console.log('Successfully moved ' + movedIds.size() + ' comp(s)');
                            } else {
                                console.log('Failed to move comp(s)');
                            }
                        });
                        $scope.markedComps = undefined;
                        $scope.selection = [];
                    }
                }
            }
            $scope.ClearNodeSelection();
        }

        $scope.ExpandParentNodes = function() {
            for (var i=0; i<$scope.nodeSelection.length; i++) {
                var foundNode = $scope.idpathMap[$scope.nodeSelection[i]];
                if (foundNode) {
                    var parentNode = $scope.uidMap[foundNode.parent];
                    while (parentNode) {
                        parentNode.expanded = true;

                        parentNode = $scope.uidMap[parentNode.parent];
                    }
                }
            }
        }
    }]);

function GetModelId(idpath) {
    var id = "";
    if (idpath.length > 1) {
        var n = idpath.indexOf('/');
        if (n == -1) {
            id = idpath.substr(1);
        } else {
            id = idpath.substr(1, n-1);
        }
    }

    if (id == "") {
        id = '1';
    }

    return id;
}

function Data(uid, idpath, name) {
    this.uid = uid;
    this.idpath = idpath;
    this.name = name;
    this.modelId = GetModelId(this.idpath);
}

function Node(data) {
    this.data = data;
    this.visible  = 'UNCHECKED';//CHECKED/PARTIAL/UNCHECKED
    this.expanded = false;//true/false
    this.parent   = ""; // uid
    this.children = [];   // array of uid
    this.visState = 9;
    /*
    1 VS_VisNoChdrnVis      CHECKED
    2 VS_NotVisNoChdrnVis   UNCHECKED
    3 VS_VisSomeChdrnVis    CHECKED
    4 VS_NotVisSomeChdrnVis PARTIAL
    5 VS_VisAllChdrnVis     CHECKED
    6 VS_NotVisAllChdrnVis  CHECKED
    7 VS_VisThumb           CHECKED
    8 VS_VisPartlyVis       PARTIAL
    9 VS_Num                UNCHECKED
    */
    this.icon = -1;
    /*
    0 ICON_ASSEMBLY
    1 ICON_INSTANCE
    2 ICON_INSTANCE_UNLOADED
    3 ICON_INSTANCE_MISSING
    4 ICON_BRANCHLINK
    5 ICON_BRANCHLINK_ASSY
    6 ICON_BRANCHLINK_PART
    7 ICON_FAILED_BRANCHLINK
    */
}

function Tree(data) {
    var node = new Node(data);
    this._root = node;
}

Tree.prototype.UpdateNodeIcon = function(node, icon) {
    if (node) {
        node.icon = icon;
    }
}

Tree.prototype.UpdateNodeVisiblity = function(node, vis) {
    if (node) {
        node.visState = vis;
        switch (vis) {
            case 1: // VS_VisNoChdrnVis
            case 3: // VS_VisSomeChdrnVis
            case 5: // VS_VisAllChdrnVis
            case 6: // VS_NotVisAllChdrnVis
            case 7: // VS_VisThumb
                // CHECKED
                node.visible = 'CHECKED';
                break;

            case 4: // VS_NotVisSomeChdrnVis
            case 8: // VS_VisPartlyVis
                // PARTIAL
                node.visible = 'PARTIAL';
                break;

            case 2: // VS_NotVisNoChdrnVis
            case 9: // VS_Num
            default:
                // UNCHECKED
                node.visible = 'UNCHECKED';
                break;
        }
    }
}

Tree.prototype.AddNode = function(data) {
    //alert(22222)
    var scope = angular.element(document.getElementById('app')).scope();

    var child = new Node(data),
        parent = this._root;

    var ids = SplitIdpath(data.idpath);
    var depth = ids.length;

    // Find parent
    if (depth > 1) {
        parent = this.FindParentNode(depth, ids);
    }

    // Add child
    if (parent) {
        var index = FindIndexWithIdpath(parent.children, child.data.idpath);
        if (index === undefined) {
            // If parent does not have this child
            parent.children.push(child.data.uid);
            scope.uidMap[child.data.uid] = child;
            scope.idpathMap[child.data.idpath] = child;

            if (parent.uiNode) {
                if (parent.uiNode.children.length > 0) {
                    var objItem = new Object();
                    objItem.uid = child.data.uid;
                    objItem.children = [];
                    objItem.parent = parent.uiNode;
                    parent.uiNode.children.push(objItem);
                    scope.uidMap[child.data.uid].uiNode = objItem;
                }
            }

            child.parent = parent.data.uid;
        }
    }

    return child;
}

Tree.prototype.RemoveNode = function(node) {
    var scope = angular.element(document.getElementById('app')).scope();

    var parent = scope.uidMap[node.parent];
    if (!parent) {
        console.log("Parent is null!");
    } else {
        var index = FindIndexWithIdpath(parent.children, node.data.idpath);
        if (index !== undefined) {
            parent.children.splice(index, 1);
            delete scope.uidMap[node.data.uid];
            delete scope.idpathMap[node.data.idpath];
            if (node.uiNode) {
                var uiParent = node.uiNode.parent;
                if (uiParent != undefined) {
                    var id = uiParent.children.indexOf(node.uiNode);
                    if (id != -1) {
                        uiParent.children.splice(id, 1);
                    }
                }
                node.uiNode = null;
            }
            node = null;
        }
    }
}

Tree.prototype.FindParentNode = function(depth, ids) {
    var parent = this._root,
        count = 1;
    while (count != depth) {
        var idpath = ConstructIdpath(count, ids);
        var parentIndex = FindIndexWithIdpath(parent.children, idpath);

        if (parentIndex === undefined) {
            throw new Error('Parent node does not exist.');
        } else {
            parent = angular.element(document.getElementById('app')).scope().uidMap[parent.children[parentIndex]];
        }
        count++;
    }

    return parent;
}

Array.prototype.clean = function (deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
}

function SplitIdpath(idpath) {
    var arr = idpath.split("/");
    arr.clean("");
/*
    var depth = arr.length;
    if (depth > 0) {
        if (arr[0] == "") {
            arr.splice(0, 1);
        }
    }
*/
    return arr;
}

function ConstructIdpath(num, arr) {
    var idpath = "";

    for (var i = 0; i < num; i++) {
        if (i == 0) {
            idpath = arr[i];
        } else {
            idpath = idpath + "/" + arr[i]
        }
    }

    return idpath;
}

function FindIndexWithIdpath(arr, idpath) {
    var index;

    for (var i = 0;i < arr.length; i++) {
        var path = angular.element(document.getElementById('app')).scope().uidMap[arr[i]].data.idpath;
        if (path === idpath) {
            index = i;
            return index;
        }
    }

    return index;
}

function OnDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData("text", e.target.id);
}

function OnDragEnter(e) {
    e.dataTransfer.dropEffect = 'move';

    e.stopPropagation();
    e.preventDefault();
}

function OnDragOver(e) {
    e.dataTransfer.dropEffect = 'move';

    e.stopPropagation();
    e.preventDefault();
}

function OnDrop(e) {
    angular.element(document.getElementById('treeApp')).scope().SEDragDrop(e.target.id);

    e.stopPropagation();
    e.preventDefault();
}
