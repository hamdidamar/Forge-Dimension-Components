import './newExt.css'
var selectedModelName;
export default function RegisterNewExtTool() {
    var Autodesk = window.Autodesk;
    var AutodeskNamespace = window.AutodeskNamespace;
    var THREE = window.THREE;
    AutodeskNamespace("Autodesk.ADN.Viewing.Extension");
    Autodesk.ADN.Viewing.Extension.NewExtTool = function (viewer) {
        var viewer = window.viewer;
        var _selectedModel = null;
        function NewExtTool() {
            //-----DECLERATIONS-----------
            var _selectedFragProxyMap = {};
            var _modifiedFragIdMap = {};
            var _hitPoint = null;
            let matrix = new THREE.Matrix4();
            let fragProxy = null;
            var selectedFragID = null;
            let loadedModelUrn = null;
            let loadedModel = null;
            var fragbBox = new THREE.Box3();
            var loadedModelbox = null;
            var fraglist = null;
            var refFragProxy = null
            var faceOffsets = ["TopRef", "BottomRef", "LeftRef", "RightRef"];
            var instanceTree = null;

            //-----ACTIVATE TRIGGER-----------
            this.activate = function () {
                loadedModel = null;
                viewer.select([]);
                viewer.addEventListener(
                    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, onSelectEvent);
                console.log("Add Part Extension Activate");

                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "flex";

                modelLoadContainer.style.flexFlow = "column";
                modelLoadContainer.style.minWidth = "200px";
                modelLoadContainer.style.width = "10%";
                modelLoadContainer.style.backgroundColor = "White";


                var modelEditHeader = document.getElementById("transformHeader");
                modelEditHeader.textContent = "Load/Edit Model";

                var modelLoadSelection = document.getElementById("modelLoadSelection");
                modelLoadSelection.style.display = "block";
            };
            //-----DEACTIVATE TRIGGER--------
            this.deactivate = function () {
                removeTxtEvent();
                console.log("Add Part Extension Deactivate");

                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "none";
            };
            //-----MOUSE SETTINGS----------
            function normalize(screenPoint) {

                var viewport = viewer.navigation.getScreenViewport();

                var n = {
                    x: (screenPoint.x - viewport.left) / viewport.width,
                    y: (screenPoint.y - viewport.top) / viewport.height
                };

                return n;
            }
            this.handleButtonDown = function (event, button) {
                _hitPoint = getHitPoint(event);
            };

            function getHitPoint(event) {
                var screenPoint = {
                    x: event.clientX,
                    y: event.clientY
                };
                var n = normalize(screenPoint);
                var hitPoint = viewer.utilities.getHitPoint(n.x, n.y);
                return hitPoint;
            }
            this.getNames = function () {
                return ['newExtTool'];
            };
            this.getName = function () {

                return 'newExtTool';
            };

            //----------CUSTOM FUNCTIONS----------

            function onSelectEvent(event) {
                //set selected model
                _selectedModel = viewer.getAggregateSelection()[0].model;


                _selectedFragProxyMap = {};
                //component unselected
                if (!event.selections[0].fragIdsArray.length) {
                    _hitPoint = null;
                    return;
                }
                if (_hitPoint) {
                    event.selections[0].fragIdsArray.forEach(function (fragId) {
                        fragProxy = viewer.impl.getFragmentProxy(
                            _selectedModel,
                            fragId
                        );
                        fragProxy.getAnimTransform();
                        var offset = {
                            x: _hitPoint.x - fragProxy.position.x,
                            y: _hitPoint.y - fragProxy.position.y,
                            z: _hitPoint.z - fragProxy.position.z
                        };
                        console.log(fragProxy);
                        fragProxy.offset = offset;
                        fragProxy.getOriginalWorldMatrix(matrix);
                        _selectedFragProxyMap[fragId] = fragProxy;
                        _modifiedFragIdMap[fragId] = {}
                        selectedFragID = fragId;
                    });
                    loadedModelUrn = document.getElementById("selectedModelUrn").textContent;
                    // Check if it's a urn pointing at a file from OSS
                    if (loadedModelUrn.startsWith("urn:")) {
                        fetch("/api/viewables/token")
                            .then(response => response.text())
                            .then(token => {
                                Autodesk.Viewing.endpoint.setEndpointAndApi("https://developer.api.autodesk.com", 'modelDerivativeV2');
                                Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS["Authorization"] = "Bearer " + token;
                                loadDocument(loadedModelUrn, fragProxy);
                            })
                    }
                    else {
                        Autodesk.Viewing.endpoint.setEndpointAndApi("", 'modelDerivativeV2');
                        delete Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS["Authorization"];

                        loadDocument(loadedModelUrn, fragProxy);
                    }
                    _hitPoint = null;
                    viewer.removeEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, onSelectEvent);
                }
                else {
                    alert("No item Selected!");
                    console.log("No item Selected!");
                }

            }

            function loadDocument(documentId, fragProxy) {
                Autodesk.Viewing.Document.load(documentId, (doc) => {
                    let items = doc.getRoot().search(
                        {
                            type: "geometry",
                            role: "3d",
                        },
                        true
                    );
                    if (items.length === 0) {
                        console.error("Document contains no viewables.");
                        return;
                    }
                    let loadMatrixTemp = new THREE.Matrix4();
                    let matrixArr = [];
                    matrix.elements.forEach(element => {
                        if (Math.abs(element) < 0.00001) {
                            element = 0;
                            matrixArr.push(element);
                        }
                        if (element != 0) {
                            if (element > 0) {
                                element = 1;
                                matrixArr.push(element);
                            }
                            else {
                                element = -1;
                                matrixArr.push(element);
                            }
                        }
                        loadMatrixTemp.fromArray(matrixArr);
                    });

                    var fragOffsetPoint = new THREE.Vector3(fragProxy.offset.x, fragProxy.offset.y, fragProxy.offset.z);
                    loadMatrixTemp.setPosition(fragOffsetPoint);
                    viewer
                        .loadDocumentNode(doc, items[0], {
                            keepCurrentModels: true,
                        })
                        .then(function (model) {
                            loadedModel = null;
                            loadedModel = model;
                            var refFragId = null;

                            instanceTree = loadedModel.getData().instanceTree;
                            
                            console.log(instanceTree);
                            fraglist = loadedModel.getFragmentList();
                            for (var i = 0; i < fraglist.fragments.fragId2dbId.length; i++) {
                                var parentId = instanceTree.getNodeParentId(fraglist.fragments.fragId2dbId[i]);
                                var nodeName = instanceTree.getNodeName(parentId);
                                console.log(nodeName);
                                if (nodeName == "refPlane:1") {
                                    refFragId = i;
                                }
                            }

                            let tr = loadedModel.getPlacementTransform();
                            tr.elements[0] = matrixArr[0];
                            tr.elements[1] = matrixArr[1];
                            tr.elements[2] = matrixArr[2];
                            tr.elements[3] = matrixArr[3];
                            tr.elements[4] = matrixArr[4];
                            tr.elements[5] = matrixArr[5];
                            tr.elements[6] = matrixArr[6];
                            tr.elements[7] = matrixArr[7];
                            tr.elements[8] = matrixArr[8];
                            tr.elements[9] = matrixArr[9];
                            tr.elements[10] = matrixArr[10];
                            tr.elements[11] = matrixArr[11];
                            tr.elements[12] = fragProxy.offset.x;
                            tr.elements[13] = fragProxy.offset.y;
                            tr.elements[14] = fragProxy.offset.z;
                            tr.elements[15] = 1;
                            loadedModel.setPlacementTransform(tr);
                            var refFragBox = new THREE.Box3();
                            fraglist.getWorldBounds(refFragId, refFragBox);

                            console.log(refFragBox);
                            var refDistX = fragProxy.offset.x - ((refFragBox.max.x + refFragBox.min.x)/2);
                            var refDistY = fragProxy.offset.y - ((refFragBox.max.y + refFragBox.min.y)/2);
                            var refDistZ = fragProxy.offset.z - ((refFragBox.max.z + refFragBox.min.z)/2);
                            tr = loadedModel.getPlacementTransform();
                            tr.elements[12] += refDistX;
                            tr.elements[13] += refDistY;
                            tr.elements[14] += refDistZ;
                            loadedModel.setPlacementTransform(tr);

                            viewer.impl.invalidate(true, true, true);
                            console.log(tr);
                            let loadedBox = loadedModel.getBoundingBox();
                            console.log(loadedBox);

                            updateTxt(loadedModel);
                            addTxtEvent();
                        });
                });
            }

            function getFace(model) {
                let modelMatrix = loadedModel.getPlacementTransform();
                var faceString = "";
                if (modelMatrix.elements[0] == 1 && modelMatrix.elements[4] == 0 && modelMatrix.elements[8] == 0) {
                    faceString = "Front";
                }
                else if (modelMatrix.elements[0] == 0 && modelMatrix.elements[4] == 0 && modelMatrix.elements[8] == -1) {
                    faceString = "Right"
                }
                else if (modelMatrix.elements[0] == 0 && modelMatrix.elements[4] == 0 && modelMatrix.elements[8] == 1) {
                    faceString = "Left"
                }
                else if (modelMatrix.elements[0] == -1 && modelMatrix.elements[4] == 0 && modelMatrix.elements[8] == 0) {
                    faceString = "Back"
                }
                return faceString;
            }
            function updateTxt(model) {
                loadedModelbox = model.getBoundingBox();
                fraglist = viewer.model.getFragmentList();
                fraglist.getWorldBounds(selectedFragID, fragbBox);
                var faceName = getFace(loadedModel);
                if (faceName == "Front") {
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.max.x - loadedModelbox.max.x) * 100) / 100;
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.min.x - loadedModelbox.min.x) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }
                else if (faceName == "Back") {
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.min.x - loadedModelbox.min.x) * 100) / 100;
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.max.x - loadedModelbox.max.x) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }
                else if (faceName == "Right") {
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.min.z - loadedModelbox.min.z) * 100) / 100;
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.max.z - loadedModelbox.max.z) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }
                else if (faceName == "Left") {
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.max.z - loadedModelbox.max.z) * 100) / 100;
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.min.z - loadedModelbox.min.z) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }
            }
            function addTxtEvent() {
                faceOffsets.forEach(function (txtName) {
                    console.log("event handled");
                    document.getElementById(txtName).addEventListener("change", function () {
                        positionChangeInputs(txtName);

                    });
                });
            }

            function removeTxtEvent() {
                var tool1 = document.getElementById('TopRef'),
                    toolClone1 = tool1.cloneNode(true);
                tool1.parentNode.replaceChild(toolClone1, tool1);
                var tool2 = document.getElementById('BottomRef'),
                    toolClone2 = tool2.cloneNode(true);
                tool2.parentNode.replaceChild(toolClone2, tool2);
                var tool3 = document.getElementById('RightRef'),
                    toolClone3 = tool3.cloneNode(true);
                tool3.parentNode.replaceChild(toolClone3, tool3);
                var tool4 = document.getElementById('LeftRef'),
                    toolClone4 = tool4.cloneNode(true);
                tool4.parentNode.replaceChild(toolClone4, tool4);
            }

            function positionChangeInputs(txtName) {
                fraglist.getWorldBounds(selectedFragID, fragbBox);
                loadedModelbox = loadedModel.getBoundingBox();
                var modelFace = getFace(loadedModel);
                var modeltr = null;
                var error = false;
                if (txtName == "TopRef") {
                    var oldTopRef = Math.abs(fragbBox.max.y - loadedModelbox.max.y);
                    var oldBottomRef = Math.abs(fragbBox.min.y - loadedModelbox.min.y);
                    var totalValue = oldTopRef + oldBottomRef;
                    var newTopRef = document.getElementById(txtName).value;
                    if (newTopRef <= totalValue) {
                        var difference = newTopRef - oldTopRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[13] -= difference;
                    }
                    else { error = true }
                }
                else if (txtName == "BottomRef") {
                    var oldBottomRef = Math.abs(fragbBox.min.y - loadedModelbox.min.y);
                    var oldTopRef = Math.abs(fragbBox.max.y - loadedModelbox.max.y);
                    var totalValue = oldTopRef + oldBottomRef;
                    var newBottomRef = document.getElementById(txtName).value;
                    if (newBottomRef <= totalValue) {
                        var difference = newBottomRef - oldBottomRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[13] += difference;
                    }
                    else { error = true }
                }
                else if (txtName == "RightRef") {
                    if (modelFace == "Front") {
                        var oldRightRef = Math.abs(fragbBox.max.x - loadedModelbox.max.x);
                        var oldLeftRef = Math.abs(fragbBox.min.x - loadedModelbox.min.x);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newRightRef = document.getElementById(txtName).value;
                        if (newRightRef <= totalValue + 1) {
                            var difference = newRightRef - oldRightRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[12] -= difference;
                        }
                        else { error = true }
                    }
                    else if (modelFace == "Back") {
                        var oldRightRef = Math.abs(fragbBox.min.x - loadedModelbox.min.x);
                        var oldLeftRef = Math.abs(fragbBox.max.x - loadedModelbox.max.x);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newRightRef = document.getElementById(txtName).value;
                        if (newRightRef <= totalValue + 1) {
                            var difference = newRightRef - oldRightRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[12] += difference;
                        }
                        else { error = true }
                    }
                    else if (modelFace == "Right") {
                        var oldRightRef = Math.abs(fragbBox.max.z - loadedModelbox.max.z);
                        var oldLeftRef = Math.abs(fragbBox.min.z - loadedModelbox.min.z);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newRightRef = document.getElementById(txtName).value;
                        if (newRightRef <= totalValue + 1) {
                            var difference = newRightRef - oldRightRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[14] -= difference;
                        }
                        else { error = true }
                    }
                    else if (modelFace == "Left") {
                        var oldRightRef = Math.abs(fragbBox.min.z - loadedModelbox.min.z);
                        var oldLeftRef = Math.abs(fragbBox.max.z - loadedModelbox.max.z);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newRightRef = document.getElementById(txtName).value;
                        if (newRightRef <= totalValue + 1) {
                            var difference = newRightRef - oldRightRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[14] += difference;
                        }
                        else { error = true }
                    }

                }
                else if (txtName == "LeftRef") {
                    if (modelFace == "Back") {
                        var oldLeftRef = Math.abs(fragbBox.max.x - loadedModelbox.max.x);
                        var oldRightRef = Math.abs(fragbBox.min.x - loadedModelbox.min.x);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newLeftRef = document.getElementById(txtName).value;
                        if (newLeftRef <= totalValue + 1) {
                            var difference = newLeftRef - oldLeftRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[12] -= difference;
                        }
                        else { error = true }
                    }
                    if (modelFace == "Right") {
                        var oldLeftRef = Math.abs(fragbBox.min.z - loadedModelbox.min.z);
                        var oldRightRef = Math.abs(fragbBox.max.z - loadedModelbox.max.z);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newLeftRef = document.getElementById(txtName).value;
                        if (newLeftRef <= totalValue + 1) {
                            var difference = newLeftRef - oldLeftRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[14] += difference;
                        }
                        else { error = true }

                    }
                    if (modelFace == "Left") {
                        var oldLeftRef = Math.abs(fragbBox.max.z - loadedModelbox.max.z);
                        var oldRightRef = Math.abs(fragbBox.min.z - loadedModelbox.min.z);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newLeftRef = document.getElementById(txtName).value;
                        if (newLeftRef <= totalValue + 1) {
                            var difference = newLeftRef - oldLeftRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[14] -= difference;
                        }
                        else { error = true }
                    }
                    if (modelFace == "Front") {
                        var oldLeftRef = Math.abs(fragbBox.min.x - loadedModelbox.min.x);
                        var oldRightRef = Math.abs(fragbBox.max.x - loadedModelbox.max.x);
                        var totalValue = oldRightRef + oldLeftRef;
                        var newLeftRef = document.getElementById(txtName).value;
                        if (newLeftRef <= totalValue + 1) {
                            var difference = newLeftRef - oldLeftRef;
                            modeltr = loadedModel.getPlacementTransform();
                            modeltr.elements[12] += difference;
                        }
                        else { error = true }

                    }
                }
                if (error) {
                    alert("Enter a value within the wall boundaries.");
                }
                else {
                    loadedModel.setPlacementTransform(modeltr);
                    viewer.impl.invalidate(true, true, true);
                }
                updateTxt(loadedModel);
            }

        }
        Autodesk.Viewing.Extension.call(this, viewer);
        var _self = this;

        _self.tool = null;

        _self.toolactivated = false;

        _self.onToolbarCreated = function () {
            // Create a new toolbar group if it doesn't exist
            this._group = this.viewer.toolbar.getControl('CustomExtensionsToolbar');
            if (!this._group) {
                this._group = new Autodesk.Viewing.UI.ControlGroup('CustomExtensionsToolbar');
                this.viewer.toolbar.addControl(this._group);
            }
            // Add a new button to the toolbar group
            this._button = new Autodesk.Viewing.UI.Button('NewExtToolExtensionButtom');
            this._button.onClick = (ev) => {
                // Execute an action here
                if (!_self.toolactivated) {
                    _self.initialize();
                    _self.toolactivated = true;
                    alert("Add part tool activated!");
                } else {

                    viewer.toolController.deactivateTool(_self.tool.getName());
                    _self.toolactivated = false;
                    alert("Add part tool deactivated!");
                }
            };
            if (_self.toolactivated) {
                this._button.setToolTip('Terminate New Part Tool');
            }
            else {
                this._button.setToolTip('Run Add Part Tool');
            }
            this._button.addClass('newExtIcon');
            this._group.addControl(this._button);
        };
        _self.initialize = function () {
            _self.tool = new NewExtTool();
            viewer.toolController.registerTool(_self.tool);
            //Set first model
            if (_selectedModel == null) {
                _selectedModel = this.viewer.model;
            }
            if (_selectedModel.getInstanceTree()) {
                _self.customize();
            }
            else {
                this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, _self.customize());
            }
        };
        _self.customize = function () {
            viewer.toolController.activateTool(_self.tool.getName());
        };
        _self.unload = function () {
            if (_self.tool) viewer.toolController.deactivateTool(_self.tool.getName());
            // Clean our UI elements if we added any
            if (this._group) {
                this._group.removeControl(this._button);
                if (this._group.getNumberOfControls() === 0) {
                    this.viewer.toolbar.removeControl(this._group);
                }
            }
            console.log('Autodesk.ADN.Viewing.Extension.NewExtTool unloaded');
            return true;
        };
    }


    // -----------------------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------------------


    Autodesk.ADN.Viewing.Extension.NewExtTool.prototype =
        Object.create(Autodesk.Viewing.Extension.prototype);

    Autodesk.ADN.Viewing.Extension.NewExtTool.prototype.constructor =
        Autodesk.ADN.Viewing.Extension.NewExtTool;

    Autodesk.Viewing.theExtensionManager.registerExtension(
        'NewExtToolExtension',
        Autodesk.ADN.Viewing.Extension.NewExtTool);

}