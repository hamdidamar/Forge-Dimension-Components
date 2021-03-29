import './editExtension.css';

export default function RegisterEditModelTool() {

    var Autodesk = window.Autodesk;
    var AutodeskNamespace = window.AutodeskNamespace;
    var THREE = window.THREE;


    AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

    Autodesk.ADN.Viewing.Extension.EditModelTool = function (viewer) {

        var viewer = window.viewer;

        var _selectedModel = null;
        var mainModel = viewer.model;
        var _selectedModelbBox = null;
        var _selectedModelIntersectFragId = null;




        function EditModelTool() {


            var modelFace = null;
            var modeltr = null;
            var oldTopRef = null;
            var newTopRef = null;
            var oldBottomRef = null;
            var newBottomRef = null;
            var oldRightRef = null;
            var newRightRef = null;
            var oldLeftRef = null;
            var newLeftRef = null;
            var difference = null;
            var intersectFragId = null;
            var fragList = null;
            var fragbBox = null;


            // //inputs
            // var faceOffsets = ["TopRef", "BottomRef", "LeftRef", "RightRef"];
            // faceOffsets.forEach(function (face) {
            //     document.getElementById(face).addEventListener("change", function () {
            //         positionChangeInputs(face);
            //     });
            // });

            //Get frag list
            fragList = viewer.model.getFragmentList();

            //set selected model
            function setSelectedModel() {
                try {
                    _selectedModel = viewer.getAggregateSelection()[0].model;
                } catch (error) {
                    _selectedModel = viewer.model;
                }
            }

            function onItemSelected() {
                setSelectedModel();
                if (_selectedModel != null) {

                    if (_selectedModel != viewer.model) {
                        console.log("Edit Extension Select Model");
                        console.log(_selectedModel);

                        //find intersection
                        var intersectFragId = getFragIdIntersectWithSelectedModel(_selectedModel);
                        console.log("find intersect:");
                        console.log(intersectFragId);


                        //set boxes
                        _selectedModelbBox = _selectedModel.getBoundingBox();
                        fragbBox = new THREE.Box3();
                        var fragmentList = viewer.model.getFragmentList();
                        fragmentList.getWorldBounds(intersectFragId, fragbBox);

                        //set inputs
                        //setInputValues(_selectedModel, fragbBox, _selectedModelbBox);
                        updateTxt(_selectedModel);
                    }
                    else {
                        alert("Main model cannot edit")
                        setInputsEmpty();
                    }

                }
                else {
                    console.log("Please select model");
                    setInputsEmpty();
                }

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



            //Get fragId
            function getFragIdIntersectWithSelectedModel(_selectedModel) {
                _selectedModelbBox = _selectedModel.getBoundingBox();
                //Get frag list
                var fragmentList = viewer.model.getFragmentList();
                for (let i = 0; i < fragmentList.fragments.length; i++) {
                    //console.log(fragmentList[i]);
                    fragbBox = new THREE.Box3()
                    fragmentList.getWorldBounds(i, fragbBox);
                    if (_selectedModelbBox.isIntersectionBox(fragbBox) === true) {
                        _selectedModelIntersectFragId = i;
                    }
                }

                return _selectedModelIntersectFragId;
            }

            //positionChangeInputs 
            function positionChangeInputs(face) {
                console.log("Position function")
                setSelectedModel();
                intersectFragId = getFragIdIntersectWithSelectedModel(_selectedModel);
                //set boxes
                _selectedModelbBox = _selectedModel.getBoundingBox();
                fragbBox = new THREE.Box3();
                var fragmentList = viewer.model.getFragmentList();
                fragmentList.getWorldBounds(intersectFragId, fragbBox);

                //setPosition
                setPosition(face, _selectedModel, fragbBox, _selectedModelbBox);

                //setInputValues
                //setInputValues(_selectedModel, fragbBox, _selectedModelbBox);
                updateTxt(_selectedModel);

            }

            //getFace
            function getFace(_selectedModel) {
                let modelMatrix = _selectedModel.getPlacementTransform();
                var faceString = "";
                if (modelMatrix.elements[0] === 1 && modelMatrix.elements[4] === 0 && modelMatrix.elements[8] === 0) {
                    faceString = "Front";
                }
                else if (modelMatrix.elements[0] === 0 && modelMatrix.elements[4] === 0 && modelMatrix.elements[8] === -1) {
                    faceString = "Right"
                }
                else if (modelMatrix.elements[0] === 0 && modelMatrix.elements[4] === 0 && modelMatrix.elements[8] === 1) {
                    faceString = "Left"
                }
                else if (modelMatrix.elements[0] === -1 && modelMatrix.elements[4] === 0 && modelMatrix.elements[8] === 0) {
                    faceString = "Back"
                }
                return faceString;
            }


            //setInputs
            function setInputValues(_selectedModel, fragbBox, _selectedModelbBox) {
                var faceName = getFace(_selectedModel);
                if (faceName === "Front") {
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.max.x - _selectedModelbBox.max.x) * 100) / 100;
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.min.x - _selectedModelbBox.min.x) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - _selectedModelbBox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - _selectedModelbBox.min.y) * 100) / 100;
                }
                else if (faceName === "Back") {
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.min.x - _selectedModelbBox.min.x) * 100) / 100;
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.max.x - _selectedModelbBox.max.x) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - _selectedModelbBox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - _selectedModelbBox.min.y) * 100) / 100;
                }
                else if (faceName === "Right") {
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.min.z - _selectedModelbBox.min.z) * 100) / 100;
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.max.z - _selectedModelbBox.max.z) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - _selectedModelbBox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - _selectedModelbBox.min.y) * 100) / 100;
                }
                else if (faceName === "Left") {
                    document.getElementById("LeftRef").value = Math.round(Math.abs(fragbBox.max.z - _selectedModelbBox.max.z) * 100) / 100;
                    document.getElementById("RightRef").value = Math.round(Math.abs(fragbBox.min.z - _selectedModelbBox.min.z) * 100) / 100;
                    document.getElementById("TopRef").value = Math.round(Math.abs(fragbBox.max.y - _selectedModelbBox.max.y) * 100) / 100;
                    document.getElementById("BottomRef").value = Math.round(Math.abs(fragbBox.min.y - _selectedModelbBox.min.y) * 100) / 100;
                }

            }


            //updateTxt
            function updateTxt(model) {
                var loadedModelbox = model.getBoundingBox();
                var fraglist = viewer.model.getFragmentList();
                fraglist.getWorldBounds(intersectFragId, fragbBox);
                var faceName = getFace(model);
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



            //set Position
            function setPosition(face, _selectedModel, fragbBox, _selectedModelbBox) {
                modelFace = getFace(_selectedModel);
                modeltr = null;
                if (face === "TopRef") {
                    oldTopRef = Math.abs(fragbBox.max.y - _selectedModelbBox.max.y);
                    newTopRef = document.getElementById("TopRef").value;
                    difference = newTopRef - oldTopRef;
                    modeltr = _selectedModel.getPlacementTransform();
                    modeltr.elements[13] -= difference;
                }
                else if (face === "BottomRef") {
                    oldBottomRef = Math.abs(fragbBox.min.y - _selectedModelbBox.min.y);
                    newBottomRef = document.getElementById("BottomRef").value;
                    difference = newBottomRef - oldBottomRef;
                    modeltr = _selectedModel.getPlacementTransform();
                    modeltr.elements[13] += difference;
                }
                else if (face === "RightRef") {
                    if (modelFace === "Front") {
                        oldRightRef = Math.abs(fragbBox.max.x - _selectedModelbBox.max.x);
                        newRightRef = document.getElementById("RightRef").value;
                        difference = newRightRef - oldRightRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[12] -= difference;
                    }
                    else if (modelFace === "Back") {
                        oldRightRef = Math.abs(fragbBox.min.x - _selectedModelbBox.min.x);
                        newRightRef = document.getElementById("RightRef").value;
                        difference = newRightRef - oldRightRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[12] += difference;
                    }
                    else if (modelFace === "Right") {
                        oldRightRef = Math.abs(fragbBox.max.z - _selectedModelbBox.max.z);
                        newRightRef = document.getElementById("RightRef").value;
                        difference = newRightRef - oldRightRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[14] -= difference;
                    }
                    else if (modelFace === "Left") {
                        oldRightRef = Math.abs(fragbBox.min.z - _selectedModelbBox.min.z);
                        newRightRef = document.getElementById("RightRef").value;
                        difference = newRightRef - oldRightRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[14] += difference;
                    }

                }
                else if (face === "LeftRef") {
                    if (modelFace === "Back") {
                        oldLeftRef = Math.abs(fragbBox.max.x - _selectedModelbBox.max.x);
                        newLeftRef = document.getElementById("LeftRef").value;
                        difference = newLeftRef - oldLeftRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[12] -= difference;
                    }
                    if (modelFace === "Right") {
                        oldLeftRef = Math.abs(fragbBox.min.z - _selectedModelbBox.min.z);
                        newLeftRef = document.getElementById("LeftRef").value;
                        difference = newLeftRef - oldLeftRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[14] += difference;
                    }
                    if (modelFace === "Left") {
                        oldLeftRef = Math.abs(fragbBox.max.z - _selectedModelbBox.max.z);
                        newLeftRef = document.getElementById("LeftRef").value;
                        difference = newLeftRef - oldLeftRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[14] -= difference;
                    }
                    if (modelFace === "Front") {
                        oldLeftRef = Math.abs(fragbBox.min.x - _selectedModelbBox.min.x);
                        newLeftRef = document.getElementById("LeftRef").value;
                        difference = newLeftRef - oldLeftRef;
                        modeltr = _selectedModel.getPlacementTransform();
                        modeltr.elements[12] += difference;

                    }
                }
                _selectedModel.setPlacementTransform(modeltr);
                viewer.impl.invalidate(true, true, true);

                //setInputValues(_selectedModel, fragbBox, _selectedModelbBox);

            }


            ///////////////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////////////
            this.getNames = function () {

                return ['editModelTool'];
            };

            this.getName = function () {

                return 'editModelTool';
            };

            ///////////////////////////////////////////////////////////////////////////
            // activates tool
            ///////////////////////////////////////////////////////////////////////////
            this.activate = function () {
                viewer.select([]);

                viewer.addEventListener(
                    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
                    onItemSelected);

                console.log("Edit Model Extension Activate");


                //inputs
                var faceOffsets = ["TopRef", "BottomRef", "LeftRef", "RightRef"];
                faceOffsets.forEach(function (face) {
                    document.getElementById(face).addEventListener("change", function () {
                        positionChangeInputs(face);
                    });
                });

                console.log("Events listeners added");

                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "flex";
                modelLoadContainer.style.flexFlow = "column";
                modelLoadContainer.style.minWidth = "200px";
                modelLoadContainer.style.width = "10%";
                modelLoadContainer.style.backgroundColor = "White";

                var modelLoadSelection = document.getElementById("modelLoadSelection");
                modelLoadSelection.style.display = "none";

                var modelEditHeader = document.getElementById("transformHeader");
                modelEditHeader.textContent = "Edit Model";

                var models = document.getElementsByClassName("model");
                models.forEach(model => {
                    model.style.display = "none"
                });

                setInputsEmpty();

                document.getElementById("modelEditSave").addEventListener("click", function () {
                    var ex = viewer.getExtension("EditModelToolExtension")
                    ex.tool.deactivate();
                })

            };

            // set empty input
            function setInputsEmpty() {
                document.getElementById("RightRef").value = "";
                document.getElementById("LeftRef").value = "";
                document.getElementById("TopRef").value = "";
                document.getElementById("BottomRef").value = "";
            }


            ///////////////////////////////////////////////////////////////////////////
            // deactivate tool
            //
            ///////////////////////////////////////////////////////////////////////////
            this.deactivate = function () {


                viewer.impl.removeOverlayScene(
                    'editModelTool');


                viewer.removeEventListener(
                    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
                    onItemSelected);


                console.log("Edit Model Extension Deactivate");

                //inputs
                var faceOffsets = ["TopRef", "BottomRef", "LeftRef", "RightRef"];
                faceOffsets.forEach(function (face) {
                    document.getElementById(face).addEventListener("change", function () {
                        positionChangeInputs(face);
                    });
                });

                console.log("Events listeners deleted");

                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "none";

                removeTxtEvent();

                document.getElementById("modelEditSave").removeEventListener("click", function () {
                    console.log("Edit Model Extension Deactivate");
                })

                //alert("Edit Model Extension Deactivate");
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

            console.log('Autodesk.ADN.Viewing.Extension.EditModelTool loaded');

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
            this._button = new Autodesk.Viewing.UI.Button('EditModelToolExtensionButton');
            this._button.onClick = (ev) => {
                // Execute an action here
                if (!_self.toolactivated) {
                    _self.initialize();
                    _self.toolactivated = true;
                } else {
                    viewer.toolController.deactivateTool(_self.tool.getName());
                    _self.toolactivated = false;
                    document.getElementById("modelEditSave").removeEventListener("click", function () {
                        console.log("Edit Model Extension Deactivate");
                    })
                }
            };
            this._button.setToolTip('Edit Model Extension');
            this._button.addClass('EditModelIcon');
            this._group.addControl(this._button);
        };

        _self.initialize = function () {
            _self.tool = new EditModelTool();

            viewer.toolController.registerTool(_self.tool);

            //Set first model
            if (_selectedModel == null) {
                _selectedModel = this.viewer.model;
            }

            if (_selectedModel.getInstanceTree()) {
                _self.customize();
            } else {
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
            document.getElementById("modelEditSave").removeEventListener("click", function () {
                console.log("Edit Model Extension Deactivate");
            })
            // Clean our UI elements if we added any
            if (this._group) {
                this._group.removeControl(this._button);
                if (this._group.getNumberOfControls() === 0) {
                    this.viewer.toolbar.removeControl(this._group);
                }
            }
            console.log('Autodesk.ADN.Viewing.Extension.EditModelTool unloaded');

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
                    return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
                });

            return guid;
        };


    };

    Autodesk.ADN.Viewing.Extension.EditModelTool.prototype =
        Object.create(Autodesk.Viewing.Extension.prototype);

    Autodesk.ADN.Viewing.Extension.EditModelTool.prototype.constructor =
        Autodesk.ADN.Viewing.Extension.EditModelTool;

    Autodesk.Viewing.theExtensionManager.registerExtension(
        'EditModelToolExtension',
        Autodesk.ADN.Viewing.Extension.EditModelTool);
}






