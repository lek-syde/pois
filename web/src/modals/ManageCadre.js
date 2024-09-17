import React from 'react';
import { Form, Field } from 'react-final-form';
import { FORM_ERROR } from 'final-form';

import ModalWrapper from '../container/ModalWrapper';
import { notifyWithIcon, request } from '../services/utilities';
import { CREATE_CADRE_API, UPDATE_CADRE_API } from '../services/api';
import { ErrorBlock, FormSubmitError, error } from '../components/FormBlock';
import FormWrapper from '../container/FormWrapper';

const ManageCadre = ({ closeModal, update, selectedCadre }) => {
	const onSubmit = async values => {
		try {
			const config = {
				method: selectedCadre ? 'PUT' : 'POST',
				body: { ...values, deleted_at: undefined },
			};
			const uri = selectedCadre
				? UPDATE_CADRE_API.replace(':id', selectedCadre.id)
				: CREATE_CADRE_API;
			const rs = await request(uri, config);
			notifyWithIcon('success', rs.message);
			update();
			closeModal();
		} catch (e) {
			return { [FORM_ERROR]: e.message || 'could not login user' };
		}
	};

	return (
		<ModalWrapper
			title={`${selectedCadre ? 'Edit' : 'Add'} Cadre`}
			closeModal={closeModal}
		>
			<Form
				initialValues={{ name: selectedCadre ? selectedCadre.name : '' }}
				onSubmit={onSubmit}
				validate={values => {
					const errors = {};
					if (!values.name) {
						errors.name = 'enter cadre';
					}

					return errors;
				}}
				render={({ handleSubmit, submitError, submitting }) => (
					<FormWrapper
						initialValues={{ selectedCadre }}
						onSubmit={handleSubmit}
						submitting={submitting}
					>
						<div className="modal-body">
							<FormSubmitError error={submitError} />
							<div className="row g-3">
								<div className="col-lg-12">
									<label htmlFor="name" className="form-label">
										Cadre
									</label>
									<Field id="name" name="name">
										{({ input, meta }) => (
											<input
												{...input}
												type="text"
												className={`form-control ${error(meta)}`}
												id="name"
												placeholder="Enter cadre"
											/>
										)}
									</Field>
									<ErrorBlock name="name" />
								</div>
							</div>
						</div>
						<div className="modal-footer">
							<div className="hstack gap-2 justify-content-end">
								<button
									type="submit"
									className="btn btn-success"
									disabled={submitting}
								>
									{`${selectedCadre ? 'Update' : 'Add'} Cadre`}
								</button>
							</div>
						</div>
					</FormWrapper>
				)}
			/>
		</ModalWrapper>
	);
};

export default ManageCadre;
