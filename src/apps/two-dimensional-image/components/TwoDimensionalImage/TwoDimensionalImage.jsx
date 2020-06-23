import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { I18nextProvider } from 'react-i18next';
import { normalize, denormalize, schema } from 'normalizr';
import {
	Button,
} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './twoDimensionalImage.scss';
import { MdAdd } from 'react-icons/md';
import { UndoRedo } from 'models/UndoRedo.js';
import { highContrastingColors as colors } from 'shared/utils/colorUtils';
import { getRandomInt } from 'shared/utils/mathUtils';
import { Polygon } from '../../models/polygon';
import { Vertex } from '../../models/vertex';
import { getUniqueKey } from '../../utils/utils';
import TwoDimensionalImageContext from './twoDimensionalImageContext';
import AnnotationList from '../AnnotationList/AnnotationList.jsx';
import { MdDelete, MdPanTool } from 'react-icons/md';
import Canvas from '../Canvas/Canvas.jsx';
import i18nextInstance from './i18n';

const SHORTCUTS = {
	/*
	MAGNIFIER: {
		'1X': { key: '1', code: 49 },
		'2X': { key: '2', code: 50 },
		'3X': { key: '3', code: 51 },
		'4X': { key: '4', code: 52 },
	},
	BUTTON: {
		ADD: { key: 'c', code: 67 },
		PREVIOUS: { key: 's', code: 83 },
		NEXT: { key: 'd', code: 68 },
		SKIP: { key: 'a', code: 65 },
		TOGGLE_LABEL: { key: 'shift', code: 16 },
	},
	UNDO_REDO: {
		UNDO: { key: 'z', code: 90 },
		REDO: { key: 'x', code: 88 },
	},
	*/
};

const models = [{ name: 'Major', id: 'major' }, { name: 'Clothing', id: 'clothing' }, { name: 'Tiny', id: 'tiny' }];

const tags = ['test1', 'test2', 'test3'];

class TwoDimensionalImage extends Component {
	constructor(props) {
		super(props);
		const {
			defaultAnnotations,
			isLabelOn,
			imageWidth,
		} = props;

		const entities = { options: {}, annotations: {} };
		let rootOptionId = '';
		let annotations = [];
		// normalize
		if (props.options && Object.keys(props.options).length !== 0) {
			const option = new schema.Entity('options');
			const children = new schema.Array(option);
			option.define({ children });
			const normalizedOptions = normalize(props.options, option);
			entities.options = normalizedOptions.entities.options;
			rootOptionId = normalizedOptions.result;
		} else {
			rootOptionId = '0';
			entities.options['0'] = { id: '0', value: 'root', children: [] };
		}

		if (defaultAnnotations && defaultAnnotations.length !== 0) {
			const annotation = new schema.Entity('annotations');
			const normalizedAnn = normalize(defaultAnnotations, [annotation]);
			entities.annotations = normalizedAnn.entities.annotations;
			annotations = normalizedAnn.result;
		}

		this.state = {
			isAdding: false,
			focusedName: '',
			magnifyingPower: 1,
			isLabelOn,
			entities,
			customizedOptionInputFocused: false,
			rootOptionId,
			imageScaleFactor: 1,
			imageHeight: 0,
			imageWidth,
			annotations,
			/* Image Labeler States */
			isAddingObject: false,
			selectedModel: false,
			isLabelsCorrected: false,
		};
		this.UndoRedoState = new UndoRedo();
	}

	componentDidMount = () => {
		/* Image Labeler */
		this.selectModel(models[0]);
	}

	componentDidUpdate = (_, prevState) => {
		/**
		 * Checking if entities are updated and passing updated
		 * annotations to the onAnnotationUpdate prop.
		 */
		const { entities } = this.state;
		const { isViewOnlyMode } = this.props;
		if (!isViewOnlyMode && prevState.entities.annotations && prevState.entities !== entities) {
			this.handleAnnotationUpdate(entities.annotations);
		}
	}

	/* ==================== shortkey ==================== */
	handleKeydown = (e) => {
		const { onPreviousClick, onSkipClick, onNextClick } = this.props;
		const { customizedOptionInputFocused } = this.state;
		if (customizedOptionInputFocused) return;
		switch (e.keyCode) {
		case SHORTCUTS.UNDO_REDO.UNDO.code:
			this.handleUndoClick();
			break;
		case SHORTCUTS.UNDO_REDO.REDO.code:
			this.handleRedoClick();
			break;
		case SHORTCUTS.BUTTON.TOGGLE_LABEL.code:
			this.handleToggleLabel();
			break;
		case SHORTCUTS.BUTTON.ADD.code:
			this.handleAddClick();
			break;
		case SHORTCUTS.BUTTON.PREVIOUS.code:
			if (onPreviousClick) this.handleSubmit('Previous');
			break;
		case SHORTCUTS.BUTTON.SKIP.code:
			if (onSkipClick) this.handleSubmit('Skip');
			break;
		case SHORTCUTS.BUTTON.NEXT.code:
			if (onNextClick) this.handleSubmit('Next');
			break;
		case SHORTCUTS.MAGNIFIER['1X'].code:
			this.handleMagnifierChange(1);
			break;
		case SHORTCUTS.MAGNIFIER['2X'].code:
			this.handleMagnifierChange(2);
			break;
		case SHORTCUTS.MAGNIFIER['3X'].code:
			this.handleMagnifierChange(3);
			break;
		case SHORTCUTS.MAGNIFIER['4X'].code:
			this.handleMagnifierChange(4);
			break;
		default:
		}
	}

	/* ==================== control ==================== */
	handleMagnifierChange = (power) => {
		this.setState({ magnifyingPower: power });
	}

	handleToggleLabel = () => {
		this.setState(prevState => ({ isLabelOn: !prevState.isLabelOn }));
	}

	handleAddClick = () => {
		this.setState(prevState => ({ isAdding: !prevState.isAdding, focusedName: '' }));
	}

	/* ==================== undo/redo ==================== */
	handleUndoClick = () => {
		if (this.UndoRedoState.previous.length === 0) return;
		this.setState((prevState) => {
			const state = this.UndoRedoState.undo(prevState);
			return { ...state };
		});
	}

	handleRedoClick = () => {
		if (this.UndoRedoState.next.length === 0) return;
		this.setState((prevState) => {
			const state = this.UndoRedoState.redo(prevState);
			return { ...state };
		});
	}

	/* ==================== canvas ==================== */
	handleCanvasImgLoad = (e) => {
		const { imageWidth } = this.state;
		const { target } = e;
		this.setState({ imageScaleFactor: imageWidth / target.naturalWidth, imageHeight: target.height });
	}

	handleCanvasStageMouseDown = (e) => {
		const stage = e.target.getStage();
		const uniqueKey = getUniqueKey();
		const color = colors[getRandomInt(colors.length)];
		let { x, y } = stage.getPointerPosition();
		let vertices;
		this.setState((prevState) => {
			const {
				isAdding, focusedName, annotations, entities, imageWidth, imageHeight,
			} = prevState;
			if (!isAdding) return {};
			// prevent x, y exceeding boundary
			x = x < 0 ? 0 : x; x = x > imageWidth ? imageWidth : x;
			y = y < 0 ? 0 : y; y = y > imageHeight ? imageHeight : y;
			this.UndoRedoState.save(prevState);
			// first time adding
			if (!focusedName) {
				vertices = [];
				vertices.push(Vertex({
					id: `${uniqueKey}`, name: `${uniqueKey}`, x, y,
				}));
				entities.annotations[`${uniqueKey}`] = Polygon({
					id: `${uniqueKey}`, name: `${uniqueKey}`, color, vertices,
				});
				return {
					focusedName: `${uniqueKey}`,
					annotations: [...annotations, `${uniqueKey}`],
					entities: { ...entities, annotations: entities.annotations },
				};
			}
			// continuing adding
			entities.annotations[focusedName].vertices.push(Vertex({
				id: `${uniqueKey}`, name: `${uniqueKey}`, x, y,
			}));
			return { entities: { ...entities, annotations: entities.annotations } };
		});
	}

	handleCanvasVertexMouseDown = (e) => {
		const activeVertex = e.target;
		const group = activeVertex.getParent();
		this.setState((prevState) => {
			const { isAdding, focusedName, entities } = prevState;
			if (isAdding) {
				const { annotations } = entities;
				if (group.name() === focusedName && annotations[focusedName].vertices[0].name === activeVertex.name()) {
					annotations[focusedName].isClosed = true;
					return { isAdding: false, entities: { ...entities, annotations } };
				}
				return {};
			}
			return { focusedName: group.name() };
		});
	}

	handleCanvasVertexDragEnd = (e) => {
		const activeVertex = e.target;
		const group = activeVertex.getParent();
		this.setState((prevState) => {
			const {
				isAdding, entities, imageWidth, imageHeight,
			} = prevState;
			if (isAdding) return {};
			const { annotations } = entities;
			const vertices = annotations[group.name()].vertices.map((v) => {
				if (v.name !== activeVertex.name()) return v;
				// prevent x, y exceeding boundary
				let x = activeVertex.x(); let y = activeVertex.y();
				x = x < 0 ? 0 : x; x = x > imageWidth ? imageWidth : x;
				y = y < 0 ? 0 : y; y = y > imageHeight ? imageHeight : y;
				return { ...v, x, y };
			});
			annotations[group.name()].vertices = vertices;
			return { entities: { ...entities, annotations } };
		});
	}

	handleCanvasFocusing = (e) => {
		const activeShape = e.target;
		this.setState((prevState) => {
			if (prevState.isAdding) return {};
			return { focusedName: activeShape.name() };
		});
	}

	/* ==================== anootation list ==================== */
	handleAnnotationClick = (name) => { this.setState({ focusedName: name }); };

	handleAnnotationDeleteClick = (name) => {
		this.setState((prevState) => {
			const { entities } = prevState;
			const { annotations } = entities;
			delete annotations[name];
			const i = prevState.annotations.indexOf(name);
			prevState.annotations.splice(i, 1);
			return { annotations: prevState.annotations, entities: { ...entities, annotations } };
		});
	}

	/* ==================== option list ==================== */
	handleOptionCustomizedInputFocus = () => this.setState({ customizedOptionInputFocused: true });

	handleOptionCustomizedInputBlur = () => this.setState({ customizedOptionInputFocused: false });

	handleOptionCustomizedFormSubmit = (e, parentId, value) => {
		e.preventDefault();
		this.setState((prevState) => {
			const { entities } = prevState;
			const { options } = entities;
			const uniqueKey = getUniqueKey();
			options[uniqueKey] = { id: uniqueKey, value, children: [] };
			options[parentId].children.push(uniqueKey);
			return { entities: { ...entities, options } };
		});
	}

	handleOptionSelect = (name, selectedIds) => {
		this.setState((prevState) => {
			const { entities } = prevState;
			const selectedOptions = selectedIds.map(id => entities.options[id]).map(s => ({ id: s.id, value: s.value }));
			const updatedAnn = { ...entities.annotations[name], selectedOptions };
			return { entities: { ...entities, annotations: { ...entities.annotations, [name]: updatedAnn } } };
		});
	}

	handleOptionDeleteClick = (deleteIds) => {
		this.setState((prevState) => {
			const { entities } = prevState;
			const { options } = entities;
			delete options[deleteIds[deleteIds.length - 1]];
			const i = options[deleteIds[deleteIds.length - 2]].children.indexOf(deleteIds[deleteIds.length - 1]);
			options[deleteIds[deleteIds.length - 2]].children.splice(i, 1);
			return { entities: { ...entities, options } };
		});
	}


	/* ==================== submit ==================== */

	handleSubmit = (type) => {
		const {
			imageScaleFactor, imageWidth, imageHeight, annotations, entities, rootOptionId,
		} = this.state;
		const { url, onSkipClick, onPreviousClick, onNextClick } = this.props;
		const annotation = new schema.Entity('annotations');
		const denormalizedAnnotations = denormalize({ annotations }, { annotations: [annotation] }, entities).annotations;
		const option = new schema.Entity('options');
		const children = new schema.Array(option);
		option.define({ children });
		const denormalizedOptions = denormalize({ options: rootOptionId }, { options: option }, entities).options;
		switch (type) {
		case 'Skip':
			onSkipClick({
				url, imageScaleFactor, imageWidth, imageHeight, annotations: denormalizedAnnotations, options: denormalizedOptions,
			});
			break;
		case 'Previous':
			onPreviousClick({
				url, imageScaleFactor, imageWidth, imageHeight, annotations: denormalizedAnnotations, options: denormalizedOptions,
			});
			break;
		case 'Next':
			onNextClick({
				url, imageScaleFactor, imageWidth, imageHeight, annotations: denormalizedAnnotations, options: denormalizedOptions,
			});
			break;
		default:
			break;
		}
	}

	/* Image Labeler Functions */

	isAnnotationEqual = (defaultAnnotation, annotation) => {
		// Note: this implementation can change with the new edge cases found
		const result = JSON.stringify(defaultAnnotation) === JSON.stringify(annotation);
		return result;
	}

	getDefaultTag = () => tags && tags[0];

	handleAnnotationUpdate = () => {
		this.setState({ isLabelsCorrected: false });
		this.setState((prevState) => {
			const { annotations } = prevState.entities;
			const annotationIDs = Object.keys(annotations);
			if (annotationIDs) {
				annotationIDs.forEach((annotationID) => {
					const annotation = annotations[annotationID];
					if (!annotation.selectedOptions || annotation.selectedOptions.length === 0) {
						annotation.selectedOptions = [{
							id: `${annotationID}-opt`, value: this.getDefaultTag(),
						}];
					}
				});
			}
		});
	}

	correctLabels = () => {
		this.setState((prevState) => {
			const { annotations } = prevState.entities;
			const annotationIDs = Object.keys(annotations);
			const updatedAnnotations = {};
			if (annotationIDs) {
				annotationIDs.forEach((annotationID) => {
					const annotation = annotations[annotationID];
					if (annotation.isClosed) {
						const { vertices } = annotation;
						let top = Number.MAX_SAFE_INTEGER;
						let bottom = 0;
						let left = Number.MAX_SAFE_INTEGER;
						let right = 0;
						if (vertices) {
							vertices.forEach((vertice) => {
								if (vertice.x < left) {
									left = vertice.x;
								} else if (vertice.x > right) {
									right = vertice.x;
								}
								if (vertice.y < top) {
									top = vertice.y;
								} else if (vertice.y > bottom) {
									bottom = vertice.y;
								}
							});
						}
						const updatedVertices = [];
						updatedVertices.push({ x: left, y: top, id: `${annotation.name}-tl`, name: `${annotation.name}-tl`, label: '' });
						updatedVertices.push({ x: right, y: top, id: `${annotation.name}-tr`, name: `${annotation.name}-tr`, label: '' });
						updatedVertices.push({ x: right, y: bottom, id: `${annotation.name}-br`, name: `${annotation.name}-br`, label: '' });
						updatedVertices.push({ x: left, y: bottom, id: `${annotation.name}-bl`, name: `${annotation.name}-bl`, label: '' });
						annotation.vertices = updatedVertices;
					}
					updatedAnnotations[annotationID] = annotation;
				});
			}
			return prevState;
		});
		this.setState({ isLabelsCorrected: true });
	}

	renderAddTool = isAddingObject => (
		<div className='image-labeler-panel-add-section'>
			<button
				className={ `image-labeler-panel-add-section-button${isAddingObject ? ' image-labeler-panel-add-section-button--error' : ' image-labeler-panel-add-section-button--success'}` }
				onClick={ () => {
					this.setState(prevState => ({ isAddingObject: !prevState.isAddingObject }));
					this.handleAddClick();
				} }
				type='button'
			>
				{isAddingObject ? 'Cancel Object Addition' : 'Add New Object'}
			</button>
		</div>
	);

	selectModel = (modelId) => {
		this.setState({ selectedModel: modelId });
	}

	removeObject = (annotationID) => {
		this.handleAnnotationDeleteClick(annotationID);
	}

	updateSelectedTag = (tag, annotationID) => {
		this.setState((prevState) => {
			const { entities } = prevState;
			const { annotations } = entities;
			const annotation = annotations[annotationID];
			if (annotation && annotation.selectedOptions && annotation.selectedOptions[0]) {
				annotation.selectedOptions[0].value = tag;
			}
			return prevState;
		});
	}

	renderObject = (annotation, focusedName) => (
		<div
			className={ `image-labeler-panel-objects-section-object${focusedName === annotation.name ? ' image-labeler-panel-objects-section-object--focused' : ''}` }
			key={ `image-labeler-panel-objects-section-object-${annotation.id}` }
		>
			<div className='image-labeler-panel-objects-section-object-buttons'>
				<button
					className='image-labeler-panel-objects-section-object-buttons-button--select'
					onClick={ () => this.handleAnnotationClick(annotation.id) }
					type='button'
				>
					<MdPanTool />
				</button>
				<button
					className='image-labeler-panel-objects-section-object-buttons-button--remove'
					onClick={ () => this.removeObject(annotation.id) }
					type='button'
				>
					<MdDelete />
				</button>
			</div>
			<div className='image-labeler-panel-objects-section-object-label'>
				<select
					className='image-labeler-panel-objects-section-object-label-select'
					id={ `image-labeler-panel-objects-section-object-label-select-${annotation.id}` }
					name={ `image-labeler-panel-objects-section-object-label-select-${annotation.id}` }
					onChange={ e => this.updateSelectedTag(e.target.value, annotation.id) }
					value={
						annotation.selectedOptions &&
						annotation.selectedOptions[0] &&
						annotation.selectedOptions[0].value
					}
				>
					{tags && tags.map(tag => (
						<option key={ `image-labeler-panel-objects-section-object-label-tag-${tag}` } value={ tag }>{tag}</option>
					))}
				</select>
			</div>
			<div className='image-labeler-panel-objects-section-object-border' style={ { backgroundColor: annotation.color } }>&nbsp;</div>
		</div>
	)

	renderObjectsTool = (annotations, focusedName) => (
		<div className='image-labeler-panel-toolbox-section image-labeler-panel-objects-section'>
			<div className='image-labeler-panel-toolbox-section-head'>
				<div className='image-labeler-panel-toolbox-section-head-title'>Objects</div>
			</div>
			<div className='image-labeler-panel-toolbox-section-content'>
				{Object.keys(annotations) && Object.keys(annotations).map(annotationID => (
					this.renderObject(annotations[annotationID], focusedName)
				))}
			</div>
		</div>
	);

	renderSubmitTool = isLabelsCorrected => (
		<div className='image-labeler-panel-submit-section'>
			<button
				className={ `image-labeler-panel-submit-section-button${!isLabelsCorrected ? ' image-labeler-panel-submit-section-button--correct' : ' image-labeler-panel-submit-section-button--submit'} `}
				onClick={ () => {
					if (!isLabelsCorrected) {
						this.correctLabels();
					} else {
						const { entities } = this.state;
						const { annotations } = entities;
						console.log(annotations);
					}
				} }
				type='button'
			>
				{!isLabelsCorrected ? 'Correct Bounding Boxes' : 'Submit Changes'}
			</button>
		</div>
	)

	render() {
		const {
			isAdding,
			focusedName,
			magnifyingPower,
			isLabelOn,
			imageWidth,
			imageHeight,
			annotations,
			entities,
			rootOptionId,
			/* Image Labeler States */
			selectedModel,
			isLabelsCorrected,
		} = this.state;
		const {
			className,
			disabledOptionLevels,
			emptyAnnotationReminderText,
			isDynamicOptionsEnable,
			isImageLabeler,
			isViewOnlyMode,
			renderAnnotationUI,
			url,
		} = this.props;
		const twoDimensionalImageContext = {
			url,
			isAdding,
			entities,
			annotations,
			height: imageHeight,
			width: imageWidth,
			focusedName,
			isLabelOn,
			isViewOnlyMode,
			magnifyingPower,
			emptyAnnotationReminderText,
			onAnnotationClick: this.handleAnnotationClick,
			onAnnotationDeleteClick: this.handleAnnotationDeleteClick,
			isDynamicOptionsEnable,
			disabledOptionLevels,
			onOptionSelect: this.handleOptionSelect,
			onOptionDeleteClick: this.handleOptionDeleteClick,
			onOptionCustomizedInputFocus: this.handleOptionCustomizedInputFocus,
			onOptionCustomizedInputBlur: this.handleOptionCustomizedInputBlur,
			onOptionCustomizedFormSubmit: this.handleOptionCustomizedFormSubmit,
			onCanvasStageMouseDown: this.handleCanvasStageMouseDown,
			onCanvasVertexMouseDown: this.handleCanvasVertexMouseDown,
			onCanvasVertexDragEnd: this.handleCanvasVertexDragEnd,
			onCanvasLabelMouseDown: this.handleCanvasFocusing,
			onCanvasLineMouseDown: this.handleCanvasFocusing,
			onCanvasImgLoad: this.handleCanvasImgLoad,
			rootOptionId,
		};
		document.body.style.cursor = isAdding ? 'crosshair' : 'default';

		const rootClassName = `two-dimensional-image${className ? ` ${className}` : ''}`;

		if (isImageLabeler) {
			return (
				<I18nextProvider i18n={ i18nextInstance }>
					<TwoDimensionalImageContext.Provider value={ twoDimensionalImageContext }>
						<div className='image-labeler'>
							<div className='image-labeler-head'>
								<div className='image-labeler-head-url'>
									<div className='image-labeler-head-url-title'>URL</div>
									<div className='image-labeler-head-url-content'>{url}</div>
								</div>
								<div className='image-labeler-head-model'>
									<div className='image-labeler-head-model-title'>Model</div>
									<div className='image-labeler-head-model-content'>
										<select
											className='image-labeler-head-model-select'
											id='image-labeler-head-model-select'
											name='image-labeler-head-model-select'
											onChange={ e => this.selectModel(e.target.value) }
											value={ selectedModel }
										>
											<option value='volvo'>Volvo</option>
											<option value='saab'>Saab</option>
											<option value='mercedes'>Mercedes</option>
										</select>
									</div>
								</div>
							</div>
							<div className='image-labeler-panel'>
								<div className='image-labeler-panel-toolbox'>
									{this.renderAddTool(isAdding)}
									{this.renderObjectsTool(entities.annotations, focusedName)}
									{this.renderSubmitTool(isLabelsCorrected)}
								</div>
								<div className='image-labeler-panel-content'>
									<div className='image-labeler-panel-content-canvas'>
										<div style={ { position: 'relative' } }>
											<Canvas
												entities={ entities }
												focusedName={ focusedName }
												power={ magnifyingPower }
												isLabelOn={ isLabelOn }
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</TwoDimensionalImageContext.Provider>
				</I18nextProvider>
			);
		}

		return (
			<I18nextProvider i18n={ i18nextInstance }>
				<TwoDimensionalImageContext.Provider value={ twoDimensionalImageContext }>
					<div className={ rootClassName }>
						<div className='d-flex flex-wrap justify-content-around py-3 two-dimensional-image__image-canvas-container'>
							<div className='mb-3'>
								<div style={ { position: 'relative' } }>
									<Canvas
										entities={ entities }
										focusedName={ focusedName }
										power={ magnifyingPower }
										isLabelOn={ isLabelOn }
									/>
								</div>
							</div>
							{
								!isViewOnlyMode && renderAnnotationUI ?
									renderAnnotationUI(this.handleAddClick) :
									null
							}
							{/* !isViewOnlyMode && (
								<div className='mb-3'>
									{addButtonUI}
									<AnnotationList />
								</div>
							) */}
						</div>
					</div>
				</TwoDimensionalImageContext.Provider>
			</I18nextProvider>
		);
	}
}

TwoDimensionalImage.propTypes = {
	className: PropTypes.string,
	url: PropTypes.string,
	imageWidth: PropTypes.number,
	defaultAnnotations: PropTypes.arrayOf(PropTypes.object),
	isDynamicOptionsEnable: PropTypes.bool,
	disabledOptionLevels: PropTypes.arrayOf(PropTypes.string),
	emptyAnnotationReminderText: PropTypes.string,
	isViewOnlyMode: PropTypes.bool,
	onPreviousClick: PropTypes.func,
	onSkipClick: PropTypes.func,
	onNextClick: PropTypes.func,
	isLabelOn: PropTypes.bool,
	options: PropTypes.shape({
		id: PropTypes.string,
		value: PropTypes.string,
		children: PropTypes.array,
	}),
	renderAnnotationUI: PropTypes.func.isRequired,
	onAnnotationUpdate: PropTypes.func.isRequired,
	isImageLabeler: PropTypes.bool,
};
TwoDimensionalImage.defaultProps = {
	className: '',
	url: '',
	imageWidth: 400,
	defaultAnnotations: [],
	options: {},
	isDynamicOptionsEnable: false,
	disabledOptionLevels: [],
	isLabelOn: false,
	isViewOnlyMode: false,
	emptyAnnotationReminderText: '',
	onPreviousClick: () => {},
	onSkipClick: () => {},
	onNextClick: () => {},
	isImageLabeler: false,
};
export default TwoDimensionalImage;
