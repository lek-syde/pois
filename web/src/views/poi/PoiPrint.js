import '../../assets/scss/profile.css';
import {
	formatCadre,
	formatDate,
	formatDateWord,
	formatDateYear,
	formatFullName,
	formatGetInitialsName,
} from '../../services/utilities';

import React, { useEffect, useState } from 'react';
import { Button, Modal } from 'antd';
const PoiPrint = () => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button type="primary" onClick={() => setOpen(true)}>
				Open Modal of 1000px width
			</Button>
			<Modal
				title="Modal 1000px width"
				centered
				open={open}
				onOk={() => setOpen(false)}
				onCancel={() => setOpen(false)}
				width={1000}
			>
				<p>some contents...</p>
				<p>some contents...</p>
				<p>some contents...</p>
			</Modal>
		</>
	);
};
export default PoiPrint;
