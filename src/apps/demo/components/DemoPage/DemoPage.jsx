import React from 'react';
import { hot } from 'react-hot-loader';
import { TwoDimensionalImage, TwoDimensionalVideo } from 'apps/index';
import './DemoPage.css';
import { testAnnotation } from './testAnnotation';

const DemoPage = () => {
	const handleSubmit = r => console.log(r);
	const imageAnnotations = {
		major: [{
			id: 'jlyjm4py',
			name: 'jlyjm4py',
			type: 'Polygon',
			color: 'rgba(0,123,255,1)',
			isClosed: true,
			vertices: [{
				id: 'jlyjm4py', name: 'jlyjm4py', x: 200, y: 150,
			}, {
				id: 'jlyjm5em', name: 'jlyjm5em', x: 500, y: 150,
			}, {
				id: 'jlyjm6ul', name: 'jlyjm6ul', x: 500, y: 300,
			}, {
				id: 'jlyjm7r8', name: 'jlyjm7r8', x: 200, y: 300,
			}],
			selectedOptions: [{ id: '2-15', value: 'test2' }],
		}, {
			id: '123132131123',
			name: '123132131123',
			type: 'Polygon',
			color: 'rgba(0,123,255,1)',
			isClosed: true,
			vertices: [{
				id: '1231321311231', name: '1231321311231', x: 10, y: 10,
			}, {
				id: '1231321311232', name: '1231321311232', x: 150, y: 10,
			}, {
				id: '1231321311233', name: '1231321311233', x: 150, y: 60,
			}, {
				id: '1231321311234', name: '1231321311234', x: 10, y: 60,
			}],
			selectedOptions: [{ id: '2-15', value: 'test3' }],
		}],
		clothing: [{
			id: 'jlyjm4py',
			name: 'jlyjm4py',
			type: 'Polygon',
			color: 'rgba(0,123,255,1)',
			isClosed: true,
			vertices: [{
				id: 'jlyjm4py', name: 'jlyjm4py', x: 300, y: 200,
			}, {
				id: 'jlyjm5em', name: 'jlyjm5em', x: 600, y: 200,
			}, {
				id: 'jlyjm6ul', name: 'jlyjm6ul', x: 600, y: 350,
			}, {
				id: 'jlyjm7r8', name: 'jlyjm7r8', x: 300, y: 350,
			}],
			selectedOptions: [{ id: '2-15', value: 'Suspicious' }],
		}, {
			id: '123132131123',
			name: '123132131123',
			type: 'Polygon',
			color: 'rgba(0,123,255,1)',
			isClosed: true,
			vertices: [{
				id: '1231321311231', name: '1231321311231', x: 10, y: 10,
			}, {
				id: '1231321311232', name: '1231321311232', x: 150, y: 10,
			}, {
				id: '1231321311233', name: '1231321311233', x: 150, y: 60,
			}, {
				id: '1231321311234', name: '1231321311234', x: 10, y: 60,
			}],
			selectedOptions: [{ id: '2-15', value: 'Suspicious' }],
		}],
	};
	const previewNoticeList = [
		'Cells\' body range.',
		'The time that cells <u>split</u>, <u>leave</u>, <u>obscured</u> and <u>show up</u> (if applicable).',
	];
	const previewHeader = 'Please scan the video and observe the following to help you complete the task:';
	const emptyCheckSubmissionWarningText = 'Please annotate AND track one unmarked cell to complete this task.';
	const emptyCheckAnnotationItemWarningText = 'Step 2: Please track the cell bound by this box';
	const emptyAnnotationReminderText = 'Step 1: Click the button above to add a new box around a cell';

	return (
		<div>
			<div className='mb-5' style={ { height: '720px', width: '1440px' } }>
				<TwoDimensionalImage
					isDynamicOptionsEnable
					defaultAnnotations={ imageAnnotations }
					isImageLabeler
					isLabelOn
					url='https://www.gtice.is/wp-content/uploads/2015/06/Snaefellsnes_Tour_Kirkjufell_by_KateI.jpg'
					imageWidth={ 600 }
					disabledOptionLevels={ [] }
					onAnnotationUpdate={ updatedAnnotations => console.log(updatedAnnotations) }
					renderAnnotationUI={ handleAddClick => <button onClick={ () => handleAddClick() } type='button'>add</button> }
					models={ [
						{ name: 'Major', id: 'major', tags: ['test1', 'test2', 'test3'] },
						{ name: 'Clothing', id: 'clothing', tags: ['test4', 'test5', 'test6'] },
						{ name: 'Tiny', id: 'tiny', tags: ['test7', 'test8', 'test9'] },
					] }
				/>
			</div>
			<div className='mb-5'>
				<TwoDimensionalVideo
					onSubmit={ handleSubmit }
					url='https://hurriyettv.cubecdn.net/2020/05/15/htv_41518248.mp4.m3u8'
					videoWidth={ 500 }
					hasReview
					isEmptyCheckEnable
					isSplitEnable
					isShowHideEnable
					emptyCheckSubmissionWarningText={ emptyCheckSubmissionWarningText }
					emptyCheckAnnotationItemWarningText={ emptyCheckAnnotationItemWarningText }
					emptyAnnotationReminderText={ emptyAnnotationReminderText }
					numAnnotationsToBeAdded={ 20 }
					defaultAnnotations={ testAnnotation }
					previewHeader={ previewHeader }
					previewNoticeList={ previewNoticeList }
				/>
			</div>
		</div>
	);
};

export default hot(module)(DemoPage);
