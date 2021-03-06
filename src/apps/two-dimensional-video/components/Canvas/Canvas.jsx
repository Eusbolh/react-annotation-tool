import React from 'react';
import PropTypes from 'prop-types';
import {
	Stage, Layer, Rect, Group, Text,
} from 'react-konva';
import { useTranslation } from 'react-i18next';
import { SHOW } from '../../models/incident';
import ResizingAnchor from './ResizingAnchor/ResizingAnchor.jsx';
import { getInterpolatedData, INTERPOLATION_TYPE } from '../../utils/interpolationUtils';
import './canvas.scss';

const handleGroupDragMove = (e, canvasWidth, canvasHeight) => {
	if (e.target.getClassName() !== 'Group') return;
	const group = e.target;
	const topLeft = group.get('.topLeft')[0];
	const rect = group.get('Rect')[0];
	let absX; let absY;
	// boundary
	absX = topLeft.getAbsolutePosition().x;
	absY = topLeft.getAbsolutePosition().y;
	absX = absX < 0 ? 0 : absX;
	absY = absY < 0 ? 0 : absY;
	absX = absX + rect.width() > canvasWidth ? canvasWidth - rect.width() : absX;
	absY = absY + rect.height() > canvasHeight ? canvasHeight - rect.height() : absY;
	topLeft.setAbsolutePosition({ x: absX, y: absY });
	group.x(topLeft.getAbsolutePosition().x);
	group.y(topLeft.getAbsolutePosition().y);
	topLeft.position({ x: 0, y: 0 });
};

const Canvas = ({
	className,
	dotLength,
	duration,
	width: canvasWidth,
	height: canvasHeight,
	objects,
	played,
	focusing,
	isAdding,
	entities,
	annotations,
	isEmptyCheckEnable,
	onStageMouseDown,
	onGroupDragEnd,
	onGroupMouseDown,
	onDotDragEnd,
	onDotMouseDown,
}) => {
	const { t } = useTranslation('twoDimensionalVideo');
	const layerItems = [];
	const intervalDuration = 0.05; // Constant

	const playedDuration = played * duration; // Switching time representation of played from 0-1 to start-end
	const bucketTime = (playedDuration - (playedDuration % intervalDuration)).toFixed(2);
	const bucket = annotations[bucketTime];
	if (bucket && Array.isArray(bucket)) {
		bucket.forEach((annotation) => {
			const { color, height, label, width, x, y } = annotation;
			const fill = color.replace(/,1\)/, ',.1)'); // It is not optional anymore. The content is always filled.
			const rect = (
				<Rect
					x={ 0 }
					y={ 0 }
					fill={ fill }
					width={ width }
					height={ height }
					stroke={ color }
					strokeWidth={ 2 }
					onFocus={ () => {} }
					onMouseOver={ () => {} }
				/>
			);
			const labelText = (
				<Text
					offsetY={ -4 }
					offsetX={ -4 }
					x={ 0 }
					y={ 0 }
					fontFamily='Arial'
					fontStyle='bold'
					text={ label }
					fontSize={ 16 }
					lineHeight={ 1.2 }
					fill='#fff'
				/>
			);
			layerItems.push(
				<Group
					x={ x }
					y={ y }
					key={ `label-${Math.random()}` }
					id={ label }
					name={ `label-${Math.random()}` }
					draggable={ false }
					onMouseDown={ () => {} }
					onDragEnd={ (e) => {
						if (e.target.getClassName() !== 'Group') return;
						onGroupDragEnd(e);
					} }
					onDragMove={ e => handleGroupDragMove(e, canvasWidth, canvasHeight) }
				>
					{rect}
					{labelText}
				</Group>,
			);
		});
	}


	/* annotations.slice().reverse().forEach((annotationId) => {
		const {
			incidents, color, id, name, label, isManipulatable,
		} = entities.annotations[annotationId];

		const playedDuration = played * duration; // Added to switch time representation from 0-1 to start-end

		for (let i = 0; i < incidents.length; i++) {
			let x;
			let y;
			let width;
			let height;

			if (playedDuration >= incidents[i].time) {
				if (i !== incidents.length - 1 && playedDuration >= incidents[i + 1].time) {
					continue;
				}
				if (incidents[i].status !== SHOW) break; // todo

				if (i === incidents.length - 1) {
					({
						x,
						y,
						width,
						height,
					} = incidents[i]);
				} else {
					const interpoArea = getInterpolatedData({
						startIncident: incidents[i],
						endIncident: incidents[i + 1],
						currentTime: playedDuration,
						type: INTERPOLATION_TYPE.LENGTH,
					});
					const interpoPos = getInterpolatedData({
						startIncident: incidents[i],
						endIncident: incidents[i + 1],
						currentTime: playedDuration,
						type: INTERPOLATION_TYPE.POSITION,
					});
					({
						x, y,
					} = interpoPos);
					({
						width, height,
					} = interpoArea);
				}

				const fill = color.replace(/,1\)/, ',.1)'); // It is not optional anymore. The content is always filled.
				const rect = (
					<Rect
						x={ 0 }
						y={ 0 }
						fill={ fill }
						width={ width }
						height={ height }
						stroke={ color }
						strokeWidth={ 2 }
						onFocus={ () => {} }
						onMouseOver={ () => {
							if (!isManipulatable || isAdding) return;
							document.body.style.cursor = 'pointer';
						} }
					/>
				);
				const labelText = (
					<Text
						offsetY={ -4 }
						offsetX={ -4 }
						x={ 0 }
						y={ 0 }
						fontFamily='Arial'
						fontStyle='bold'
						text={ label }
						fontSize={ 16 }
						lineHeight={ 1.2 }
						fill='#fff'
					/>
				);

				let resizingAnchorsUI = null;
				const resizingAnchorsData = [
					{ x: 0, y: 0, key: 'topLeft', name: 'topLeft' },
					{ x: width, y: 0, key: 'topRight', name: 'topRight' },
					{ x: width, y: height, key: 'bottomRight', name: 'bottomRight' },
					{ x: 0, y: height, key: 'bottomLeft', name: 'bottomLeft' },
					{ x: width / 2, y: 0, key: 'top', name: 'top' },
					{ x: 0, y: height / 2, key: 'left', name: 'left' },
					{ x: width, y: height / 2, key: 'right', name: 'right' },
					{ x: width / 2, y: height, key: 'bottom', name: 'bottom' },
				];
				if (isManipulatable) {
					resizingAnchorsUI = resizingAnchorsData.map(data => (
						<ResizingAnchorlayedDuration = played * duration;
							dotLength={ dotLength }
							color={ color }
							isManipulatable={ isManipulatable }
							x={ data.x }
							y={ data.y }
							key={ data.key }
							name={ data.name }
							canvasWidth={ canvasWidth }
							canvasHeight={ canvasHeight }
							onDragEnd={ onDotDragEnd }
							onMouseDown={ onDotMouseDown }
						/>
					));
				}
				layerItems.push(
					<Group
						x={ x }
						y={ y }
						key={ name }
						id={ id }
						name={ name }
						draggable={ isManipulatable }
						onMouseDown={ (e) => {
							const group = e.target.findAncestor('Group');
							if (!isManipulatable) return;
							group.moveToTop();
							onGroupMouseDown(e);
						} }
						onDragEnd={ (e) => {
							if (e.target.getClassName() !== 'Group') return;
							onGroupDragEnd(e);
						} }
						onDragMove={ e => handleGroupDragMove(e, canvasWidth, canvasHeight) }
					>
						{rect}
						{labelText}
						{resizingAnchorsUI}
					</Group>,
				);
				break;
			}
		}
	});
	*/
	return (
		<Stage
			width={ canvasWidth }
			height={ canvasHeight }
			className='konva-wrapper'
			onMouseDown={ e => onStageMouseDown(e) }
			onMouseOver={ () => { if (isAdding) { document.body.style.cursor = 'crosshair'; } } }
			onMouseLeave={ () => { document.body.style.cursor = 'default'; } }
			onMouseOut={ () => { document.body.style.cursor = 'default'; } }
			onBlur={ () => {} }
			onFocus={ () => {} }
		>
			{ isAdding && (
				<Layer>
					<Rect fill='#ffffff' width={ canvasWidth } height={ canvasHeight } opacity={ 0.3 } />
					<Text y={ canvasHeight / 2 } width={ canvasWidth } text={ t('canvasAddingHint') } align='center' fontSize={ 16 } fill='#fff' />
				</Layer>
			)}
			<Layer>{layerItems}</Layer>
		</Stage>
	);
};

Canvas.propTypes = {
	className: PropTypes.string,
	dotLength: PropTypes.number,
};
Canvas.defaultProps = {
	className: '',
	dotLength: 6,
};
export default Canvas;
