/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Design Automation team for Inventor
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

import React, { Component } from 'react';
import { connect } from 'react-redux';
import './parametersContainer.css';
import Parameter from './parameter';
import { getActiveProject, getParameters, getUpdateParameters, modalProgressShowing, updateFailedShowing, errorData } from '../reducers/mainReducer';
import { fetchParameters, resetParameters, updateModelWithParameters } from '../actions/parametersActions';
import { showModalProgress, showUpdateFailed, invalidateDrawing } from '../actions/uiFlagsActions';
import Button from '@hig/button';
import Tooltip from '@hig/tooltip';
import { Alert24 } from "@hig/icons";

import ModalProgress from './modalProgress';
import ModalFail from './modalFail';
import { fullWarningMsg } from '../utils/conversion';

import repo from '../Repository';




export class ParametersContainer extends Component {


    componentDidMount() {
        this.props.fetchParameters(this.props.activeProject.id);
        // try {
        //     var parames = document.getElementsByClassName("parameter");
        //     parames[4].style.display = "none";
        //     parames[5].style.display = "none";
        // } catch (error) {
        //     console.log(error);
        // }
    }

    componentDidUpdate(prevProps) {
        // fetch parameters when params UI was active before projects initialized
        if (this.props.activeProject.id !== prevProps.activeProject.id)
            this.props.fetchParameters(this.props.activeProject.id);

        // var parames = document.getElementsByClassName("parameter");
        // parames[4].style.display = "none";
        // parames[5].style.display = "none";
    }

    updateClicked() {

        //get information 
        this.getPartsInfoWithPositions();

        this.props.updateModelWithParameters(this.props.activeProject.id, this.props.projectUpdateParameters);

        // mark drawing as not valid if any available
        this.props.invalidateDrawing();

    }

    onUpdateFailedCloseClick() {
        this.props.showUpdateFailed(false);
    }

    onModalProgressClose() {
        this.props.hideModalProgress();
    }


    // Get all parts info with positions
    getPartsInfoWithPositions() {

        //models dictionary

        var dict = {
            "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YXV0aGQtdmdvOXRudzI2a3dpaW5lZWVuc2t0YWUxZnVxejI3dnctNHY2LWM1NzE1NDQ2MWUxMDdjY2Q5OTcyZmM0ZWEwM2UzNTdjMzExOGQ1ZjUvTmV3JTIwU2luZ2xlJTIwRG9vciUyMChMZWZ0KSUyMDgwMCUyMDIwMDAuaWFtLnppcA": "Door",
            "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YXV0aGQtdmdvOXRudzI2a3dpaW5lZWVuc2t0YWUxZnVxejI3dnctNHY2LWM1NzE1NDQ2MWUxMDdjY2Q5OTcyZmM0ZWEwM2UzNTdjMzExOGQ1ZjUvMzAwJTIweCUyMDMwMCUyMFByZXNzZWQlMjBBbHVtaW5pdW0lMjBWZW50LmlwdA": "Vent"
        };

        console.log("Get all parts info with position")
        //viewer
        var viewer = window.viewer;

        //Three
        var THREE = window.THREE;

        // all models 
        var allModels = viewer.getAllModels();
        console.log(allModels);

        //loaded models
        var firstModel = allModels.shift(); // remove first model from all models
        console.log(firstModel);

        //first model instanceTree
        var instanceTree = firstModel.getData().instanceTree;

        //frags in firts model
        var frags = firstModel.getFragmentList();
        console.log(frags)

        //loaded model bounding boxes
        var loadedBBoxes = [];
        var modelIds = [];
        allModels.forEach(model => {
            var BBox = model.getBoundingBox();
            loadedBBoxes.push(BBox);
            modelIds.push(model.id);
        });
        console.log(loadedBBoxes);
        console.log(modelIds);

        //frag bounding boxes
        var fragBBoxes = [];
        for (let i = 0; i < frags.fragments.length; i++) {
            var fragbBox = new THREE.Box3()
            frags.getWorldBounds(i, fragbBox)
            fragBBoxes.push(fragbBox);
        }
        console.log(fragBBoxes);

        //intersect frag with models
        var intersectFrags = [];
        var intersectModels = [];
        for (let m = 0; m < loadedBBoxes.length; m++) {
            for (let n = 0; n < fragBBoxes.length; n++) {
                if (loadedBBoxes[m].isIntersectionBox(fragBBoxes[n])) {
                    if (!intersectModels.includes(m + 1)) {
                        intersectModels.push(m + 1)
                        intersectFrags.push(n)
                    }
                }
            }
        }
        console.log(intersectModels);
        console.log(intersectFrags);


        //calc all model position
        var getAllModels = viewer.getAllModels();
        var infoData = "";


        var nodeNames = [];
        var hardwareNames = [];
        var bottomPositions = [];
        var leftPositions = [];
        var secondStr = [];

        for (let i = 0; i < intersectModels.length; i++) {
            var model = getAllModels[intersectModels[i]];
            var modelUrn = model.myData.urn;
            //console.log("Find load model name")
            //console.log(modelUrn);
            var modelName = dict[modelUrn];
            //console.log(modelName);
            var face = this.getFace(model);
            console.log("Face:" + face);
            var modelBBox = model.getBoundingBox();
            var fragBBox = new THREE.Box3();
            frags.getWorldBounds(intersectFrags[i], fragBBox);

            if (face === "Front") {
                var bottomIntersectModel = Math.round(Math.abs(fragBBox.min.y - modelBBox.min.y) * 100) / 100;
                var leftIntersectModel = Math.round(Math.abs(fragBBox.min.x - modelBBox.min.x) * 100) / 100;
            }
            else if (face === "Back") {
                var bottomIntersectModel = Math.round(Math.abs(fragBBox.min.y - modelBBox.min.y) * 100) / 100;
                var leftIntersectModel = Math.round(Math.abs(fragBBox.max.x - modelBBox.max.x) * 100) / 100;
            }
            else if (face === "Right") {
                var bottomIntersectModel = Math.round(Math.abs(fragBBox.min.y - modelBBox.min.y) * 100) / 100;
                var leftIntersectModel = Math.round(Math.abs(fragBBox.min.z - modelBBox.min.z) * 100) / 100;
            }
            else if (face === "Left") {
                var bottomIntersectModel = Math.round(Math.abs(fragBBox.min.y - modelBBox.min.y) * 100) / 100;
                var leftIntersectModel = Math.round(Math.abs(fragBBox.max.z - modelBBox.max.z) * 100) / 100;
            }

            // find node name by frag 
            var parentId = instanceTree.getNodeParentId(frags.fragments.fragId2dbId[intersectFrags[i]])
            var nodeName = instanceTree.getNodeName(parentId)

            nodeNames.push(nodeName.substring(0, 4));
            hardwareNames.push(modelName);
            bottomPositions.push(bottomIntersectModel);
            leftPositions.push(leftIntersectModel);
            infoData += "Hardware:" + modelName + ",";
            infoData += "Panel:" + nodeName.substring(0, 4) + ",";
            infoData += "Bottom:" + bottomIntersectModel + ",";
            infoData += "Left:" + leftIntersectModel;
            infoData += "\n";

        }
        //this.writeToFile(infoData);


        const unique = (value, index, self) => {
            return self.indexOf(value) === index
        }

        var uniquePanels = nodeNames.filter(unique);

        //var allLoadedİnformation = [nodeNames, hardwareNames, bottomPositions, leftPositions];


        var strİnfo = "";
        for (let i = 0; i < uniquePanels.length; i++) {
            strİnfo += uniquePanels[i] + "{";
            for (let j = 0; j < nodeNames.length; j++) {
                if (uniquePanels[i] == nodeNames[j]) {
                    strİnfo += hardwareNames[j] + ",";
                    strİnfo += Math.floor(leftPositions[j]) + ",";
                    strİnfo += Math.floor(bottomPositions[j]) + ";";
                }
            }
            strİnfo += "}";
        }

        //strİnfo += "";
        console.log(strİnfo);

        console.log(this.props.projectUpdateParameters[1].value.replace("mm", ""))

        //set parameters

        // dimensions parameter
        this.props.projectUpdateParameters[4].value = "WallConstruction:" + this.props.projectUpdateParameters[0].value + ";Width:" + this.props.projectUpdateParameters[1].value.replace("mm", "") + ";Length:" + this.props.projectUpdateParameters[2].value.replace("mm", "") + ";Height:" + this.props.projectUpdateParameters[3].value.replace("mm", "");

        //panel and hardwares parameter
        if (strİnfo != "") {
            this.props.projectUpdateParameters[5].value = strİnfo;
        }

        console.log(this.props.projectUpdateParameters);


    }


    //Get face
    getFace(model) {
        let modelMatrix = model.getPlacementTransform();
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



    render() {
        const parameterList = this.props.activeProject ? this.props.projectUpdateParameters : [];
        const buttonsContainerClass = parameterList ? "buttonsContainer" : "buttonsContainer hidden";

        // if model adopted with warning - then button should became white and have a tooltip with warning details
        const adoptWarning = this.props.adoptWarning;
        const tooltipProps = adoptWarning ? { openOnHover: true, content: () => <div className="warningButtonTooltip">{adoptWarning}</div> } : { open: false };
        const buttonProps = adoptWarning ? { type: "secondary", icon: <Alert24 style={{ color: "orange" }} /> } : { type: "primary" };

        return (
            <div className="parametersContainer">
                <div className="pencilContainer">
                </div>
                <div className="parameters">
                    {
                        parameterList ?
                            parameterList.map((parameter, index) => (<Parameter key={index} parameter={parameter} />))
                            : "No parameters"
                    }
                </div>
                <hr className="parametersSeparator" />
                <div className={buttonsContainerClass}>
                    <Button style={{ width: '125px' }}
                        size="standard"
                        title="Reset"
                        type="secondary"
                        width="grow"
                        onClick={() => { this.props.resetParameters(this.props.activeProject.id, this.props.projectSourceParameters); }}
                    />
                    <div style={{ width: '14px' }} />
                    <div width="grow" /*this div makes the size of the Button below not to be broken by the encapsulating Tooltip*/>
                        <Tooltip {...tooltipProps} className="paramTooltip" anchorPoint="top-center">
                            <Button id="updateButton"
                                style={{ width: '125px' }}
                                {...buttonProps}
                                size="standard"
                                title="Update"
                                width="grow"
                                onClick={() => this.updateClicked()} />
                        </Tooltip>
                    </div>

                    {this.props.modalProgressShowing &&
                        <ModalProgress
                            open={this.props.modalProgressShowing}
                            title="Updating Project"
                            doneTitle="Update Finished"
                            label={this.props.activeProject.id}
                            icon="/Assembly_icon.svg"
                            onClose={() => this.onModalProgressClose()}
                            warningMsg={this.props.adoptWarning}
                        />
                    }
                    {this.props.updateFailedShowing &&
                        <ModalFail
                            open={this.props.updateFailedShowing}
                            title="Update Failed"
                            contentName="Project:"
                            label={this.props.activeProject.id}
                            onClose={() => this.onUpdateFailedCloseClick()}
                            errorData={this.props.errorData} />
                    }
                </div>




            </div>
        );
    }
}

/* istanbul ignore next */
export default connect(function (store) {
    const activeProject = getActiveProject(store);
    const adoptWarning = fullWarningMsg(activeProject.adoptWarnings);

    return {
        activeProject: activeProject,
        modalProgressShowing: modalProgressShowing(store),
        updateFailedShowing: updateFailedShowing(store),
        errorData: errorData(store),
        projectSourceParameters: getParameters(activeProject.id, store),
        projectUpdateParameters: getUpdateParameters(activeProject.id, store),
        adoptWarning: adoptWarning
    };
}, {
    fetchParameters, resetParameters, updateModelWithParameters, showModalProgress, showUpdateFailed, invalidateDrawing,
    hideModalProgress: () => async (dispatch) => { dispatch(showModalProgress(false)); }
})(ParametersContainer);
