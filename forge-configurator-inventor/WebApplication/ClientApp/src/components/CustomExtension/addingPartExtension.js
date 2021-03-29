import './addingPartExtension.css'
export default function RegisterAddPartTool() {
    var Autodesk = window.Autodesk;
    var AutodeskNamespace = window.AutodeskNamespace;
    var THREE = window.THREE;
    AutodeskNamespace("Autodesk.ADN.Viewing.Extension");
    Autodesk.ADN.Viewing.Extension.AddPartTool = function (viewer) {
        var viewer = window.viewer;
        var _selectedModel = null;

        // Select Event
        viewer.addEventListener(
            Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
            setSelectedModel);

        //set selected model
        function setSelectedModel() {
            try {

                _selectedModel = viewer.getAggregateSelection()[0].model;
                // var selectedBox = _selectedModel.getBoundingBox();
                // var fraglist = viewer.model.getFragmentList();
                // fragList.forEach(fragId => {
                //     var fragbBox = new THREE.Box3()
                //     fraglist.getWorldBounds(fragId, fragbBox);
                //     if (selectedBox.isIntersectionBox(fragbBox)) {
                //         console.log(fragId);
                //     }

                // });


            } catch (error) {
                _selectedModel = viewer.model;
            }
        }
        function AddPartTool() {
            var _hitPoint = null;

            var _modifiedFragIdMap = {};

            var _selectedFragProxyMap = {};

            let loadedModel = null;
            let loadedModelUrn = null;
            var _transformMesh = null;
            var _transformControlTx = null;
            var fragbBox = new THREE.Box3()
            var loadedModelbox = null;
            let fragProxy = null;
            let matrix = new THREE.Matrix4();
            var fraglist = null;
            var selectedFragID = null;
            var faceOffsets = ["TopRef", "BottomRef", "LeftRef", "RightRef"];
            var doneBtn = document.getElementById("DoneBtn");
            function positionChangeInputs(face) {
                fraglist.getWorldBounds(selectedFragID, fragbBox);
                loadedModelbox = loadedModel.getBoundingBox();
                var modelFace = getFace(loadedModel);
                var modeltr = null;
                if (face == "TopRef") {
                    var oldTopRef = Math.abs(fragbBox.max.y - loadedModelbox.max.y);
                    var newTopRef = document.getElementById("TopRef").value;
                    var difference = newTopRef - oldTopRef;
                    modeltr = loadedModel.getPlacementTransform();
                    modeltr.elements[13] -= difference;

                }
                else if (face == "BottomRef") {
                    var oldBottomRef = Math.abs(fragbBox.min.y - loadedModelbox.min.y);
                    var newBottomRef = document.getElementById("BottomRef").value;
                    var difference = newBottomRef - oldBottomRef;
                    modeltr = loadedModel.getPlacementTransform();
                    modeltr.elements[13] += difference;
                }
                else if (face == "RightRef") {
                    var modelFace = getFace(loadedModel);
                    if (modelFace == "Front") {
                        var oldRightRef = Math.abs(fragbBox.max.x - loadedModelbox.max.x);
                        var newRightRef = document.getElementById("RightRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[12] -= difference;
                    }
                    else if (modelFace == "Back") {
                        var oldRightRef = Math.abs(fragbBox.min.x - loadedModelbox.min.x);
                        var newRightRef = document.getElementById("RightRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[12] += difference;
                    }
                    else if (modelFace == "Right") {
                        var oldRightRef = Math.abs(fragbBox.max.z - loadedModelbox.max.z);
                        var newRightRef = document.getElementById("RightRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[14] -= difference;
                    }
                    else if (modelFace == "Left") {
                        var oldRightRef = Math.abs(fragbBox.min.z - loadedModelbox.min.z);
                        var newRightRef = document.getElementById("RightRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[14] += difference;
                    }

                }
                else if (face == "LeftRef") {
                    var modelFace = getFace(loadedModel);
                    if (modelFace == "Back") {
                        var oldRightRef = Math.abs(fragbBox.max.x - loadedModelbox.max.x);
                        var newRightRef = document.getElementById("LeftRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[12] -= difference;
                    }
                    if (modelFace == "Right") {
                        var oldRightRef = Math.abs(fragbBox.min.z - loadedModelbox.min.z);
                        var newRightRef = document.getElementById("LeftRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[14] += difference;
                    }
                    if (modelFace == "Left") {
                        var oldRightRef = Math.abs(fragbBox.max.z - loadedModelbox.max.z);
                        var newRightRef = document.getElementById("LeftRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[14] -= difference;
                    }
                    if (modelFace == "Front") {
                        var oldRightRef = Math.abs(fragbBox.min.x - loadedModelbox.min.x);
                        var newRightRef = document.getElementById("LeftRef").value;
                        var difference = newRightRef - oldRightRef;
                        modeltr = loadedModel.getPlacementTransform();
                        modeltr.elements[12] += difference;

                    }
                }
                loadedModel.setPlacementTransform(modeltr);
                viewer.impl.invalidate(true, true, true);
                fraglist.getWorldBounds(selectedFragID, fragbBox);
                loadedModelbox = loadedModel.getBoundingBox();
                if (modelFace == "Front") {
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.max.x - loadedModelbox.max.x) * 100) / 100;
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.min.x - loadedModelbox.min.x) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }
                else if (modelFace == "Back") {
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.min.x - loadedModelbox.min.x) * 100) / 100;
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.max.x - loadedModelbox.max.x) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }
                else if (modelFace == "Right") {
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.min.z - loadedModelbox.min.z) * 100) / 100;
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.max.z - loadedModelbox.max.z) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }
                else if (modelFace == "Left") {
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.max.z - loadedModelbox.max.z) * 100) / 100;
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.min.z - loadedModelbox.min.z) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - loadedModelbox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - loadedModelbox.min.y) * 100) / 100;
                }

            }
            function onItemSelected(event) {

                //set selected model
                _selectedModel = viewer.getAggregateSelection()[0].model;
                debugger;
                viewer.getProperties(event.selections[0].fragIdsArray[0], function (data) {
                    console.log(data.name);
                    if (data.name.startsWith("Solid")) {
                        var instanceTree = viewer.model.getData().instanceTree;
                        var parentId = instanceTree.getNodeParentId(event.dbIdArray[0])
                        viewer.select([parentId]);
                    }
                })

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
                            fragId);

                        fragProxy.getAnimTransform();
                        var offset = {
                            x: _hitPoint.x - fragProxy.position.x,
                            y: _hitPoint.y - fragProxy.position.y,
                            z: _hitPoint.z - fragProxy.position.z
                        };

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
                    } else {
                        Autodesk.Viewing.endpoint.setEndpointAndApi("", 'modelDerivativeV2');
                        delete Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS["Authorization"];

                        loadDocument(loadedModelUrn, fragProxy);
                    }


                    _hitPoint = null;


                }
                else {

                    console.log("error");
                }
            }

            //loadDocument
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

                    var a = new THREE.Vector3(fragProxy.offset.x, fragProxy.offset.y, fragProxy.offset.z);
                    loadMatrixTemp.setPosition(a);

                    viewer
                        .loadDocumentNode(doc, items[0], {
                            keepCurrentModels: true,
                        })
                        .then(function (model) {
                            console.log("Loaded Model");
                            loadedModel = null;
                            loadedModel = model;
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

                            //position
                            tr.elements[12] = fragProxy.offset.x;
                            tr.elements[13] = fragProxy.offset.y;
                            tr.elements[14] = fragProxy.offset.z;
                            tr.elements[15] = 1;
                            loadedModel.setPlacementTransform(tr);
                            viewer.impl.invalidate(true, true, true);
                            console.log(loadedModel);
                            loadedModelbox = loadedModel.getBoundingBox();
                            console.log(loadedModelbox);

                            fraglist = viewer.model.getFragmentList();

                            fraglist.getWorldBounds(selectedFragID, fragbBox);
                            console.log(fragbBox.max.x - loadedModelbox.max.x);
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
                            faceOffsets.forEach(function (face) {
                                document.getElementById(face).addEventListener("change", function () {
                                    positionChangeInputs(face);
                                });
                            });

                            viewer.removeEventListener(
                                Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
                                setSelectedModel);
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
            ///////////////////////////////////////////////////////////////////////////
            // normalize screen coordinates
            ///////////////////////////////////////////////////////////////////////////
            function normalize(screenPoint) {

                var viewport = viewer.navigation.getScreenViewport();

                var n = {
                    x: (screenPoint.x - viewport.left) / viewport.width,
                    y: (screenPoint.y - viewport.top) / viewport.height
                };

                return n;
            }

            ///////////////////////////////////////////////////////////////////////////
            // get 3d hit point on mesh
            ///////////////////////////////////////////////////////////////////////////
            function getHitPoint(event) {

                var screenPoint = {
                    x: event.clientX,
                    y: event.clientY
                };

                var n = normalize(screenPoint);

                var hitPoint = viewer.utilities.getHitPoint(n.x, n.y);

                return hitPoint;
            }

            ///////////////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////////////
            this.getNames = function () {

                return ['addPartTool'];
            };

            this.getName = function () {

                return 'addPartTool';
            };

            ///////////////////////////////////////////////////////////////////////////
            // activates tool
            //
            ///////////////////////////////////////////////////////////////////////////
            this.activate = function () {
                loadedModel = null;
                viewer.select([]);

                viewer.addEventListener(
                    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
                    onItemSelected);

                console.log("Add Part Extension Activate");
                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "inline-flex";
                

            };

            ///////////////////////////////////////////////////////////////////////////
            // deactivate tool
            //
            ///////////////////////////////////////////////////////////////////////////
            this.deactivate = function () {

                viewer.impl.removeOverlayScene(
                    'addPartTool');

                faceOffsets.forEach(function (face) {
                    document.getElementById(face).removeEventListener("change", function () {
                        positionChangeInputs(face);
                    });
                });
                viewer.removeEventListener(
                    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
                    onItemSelected);


                console.log("Add Part Extension Deactivate");
                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "none";
                
            };

            ///////////////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////////////
            this.update = function (t) {

                return false;
            };

            this.handleSingleClick = function (event, button) {


                return false;
            };

            this.handleDoubleClick = function (event, button) {

                return false;
            };


            this.handleSingleTap = function (event) {

                return false;
            };


            this.handleDoubleTap = function (event) {

                return false;
            };

            this.handleKeyDown = function (event, keyCode) {

                return false;
            };

            this.handleKeyUp = function (event, keyCode) {

                return false;
            };

            this.handleWheelInput = function (delta) {

                return false;
            };

            this.handleButtonDown = function (event, button) {

                _hitPoint = getHitPoint(event);
                // console.log("Hitpoint--------" + _hitPoint);
                // console.log("x" + _hitPoint.x);
                // console.log("y" + _hitPoint.y);
                // console.log("z" + _hitPoint.z);

            };



        }

        Autodesk.Viewing.Extension.call(this, viewer);

        var _self = this;

        _self.tool = null;

        _self.toolactivated = false;

        ///////////////////////////////////////////////////////
        // extension load callback
        //
        ///////////////////////////////////////////////////////
        _self.load = function () {

            console.log('Autodesk.ADN.Viewing.Extension.AddPartTool aaa loaded');

            return true;
        };

        _self.onToolbarCreated = function () {
            // Create a new toolbar group if it doesn't exist
            this._group = this.viewer.toolbar.getControl('CustomExtensionsToolbar');
            if (!this._group) {
                this._group = new Autodesk.Viewing.UI.ControlGroup('CustomExtensionsToolbar');
                this.viewer.toolbar.addControl(this._group);
            }

            // Add a new button to the toolbar group
            this._button = new Autodesk.Viewing.UI.Button('AddPartToolExtensionButton');
            this._button.onClick = (ev) => {
                // Execute an action here
                if (!_self.toolactivated) {
                    _self.initialize();
                    _self.toolactivated = true;
                } else {
                    viewer.toolController.deactivateTool(_self.tool.getName());
                    _self.toolactivated = false;
                }
            };
            this._button.setToolTip('Add Part Extension');
            this._button.addClass('addPartIcon');
            this._group.addControl(this._button);
        };
        _self.initialize = function () {
            _self.tool = new AddPartTool();

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

        ///////////////////////////////////////////////////////
        // extension unload callback
        //
        ///////////////////////////////////////////////////////
        _self.unload = function () {

            if (_self.tool) viewer.toolController.deactivateTool(_self.tool.getName());
            // Clean our UI elements if we added any
            if (this._group) {
                this._group.removeControl(this._button);
                if (this._group.getNumberOfControls() === 0) {
                    this.viewer.toolbar.removeControl(this._group);
                }
            }
            console.log('Autodesk.ADN.Viewing.Extension.AddPartTool unloaded');

            return true;
        };

        ///////////////////////////////////////////////////////
        // new random guid
        //
        ///////////////////////////////////////////////////////
        function guid() {

            var d = new Date().getTime();

            var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
                /[xy]/g,
                function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
                });

            return guid;
        };


    };
    Autodesk.ADN.Viewing.Extension.AddPartTool.prototype =
        Object.create(Autodesk.Viewing.Extension.prototype);

    Autodesk.ADN.Viewing.Extension.AddPartTool.prototype.constructor =
        Autodesk.ADN.Viewing.Extension.AddPartTool;

    Autodesk.Viewing.theExtensionManager.registerExtension(
        'AddPartToolExtension',
        Autodesk.ADN.Viewing.Extension.AddPartTool);
}