import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Field } from 'react-final-form';
import { FORM_ERROR } from 'final-form';
import Breadcrumbs from '../../components/Breadcrumbs';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormWrapper from '../../container/FormWrapper';
import { ErrorBlock, FormSubmitError, error } from '../../components/FormBlock';
import {
	asyncFetch,
	notifyWithIcon,
	request,
	createHeaders,
} from '../../services/utilities';
import { Flex, Input, Tag, theme, Tooltip } from 'antd';
import { message, Upload } from 'antd';
import {
	FETCH_GENDERS_API,
	FETCH_STATES_API,
	FETCH_CATEGORIES_API,
	FETCH_SOURCES_API,
	FETCH_COUNTRIES_API,
	FETCH_AFFILIATIONS_API,
	GET_POI_API,
	UPDATE_POI_API,
} from '../../services/api';
import Flatpickr from 'react-flatpickr';
import moment from 'moment';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import UploadFilePicture from '../../components/UploadFile';
import {
	categoryList,
	confirmationList,
	hasImplications,
	maritalStatusList,
	passportCategoryList,
} from '../../services/constants';
const EditPoi = () => {
	const [loaded, setLoaded] = useState(false);
	const [poi, setPoi] = useState(null);

	const [state, setState] = useState(null);
	const [maritalStatus, setMaritalStatus] = useState(null);
	const [passportCategory, setPassportCategory] = useState(null);
	const [confirmation, setConfirmation] = useState(null);
	const [category, setCategory] = useState(null);
	const [categories, setCategories] = useState([]);
	const [sources, setSources] = useState([]);
	const [source, setSource] = useState([]);
	const [affiliations, setAffliations] = useState([]);
	const [alias, setAlias] = useState([]);

	const [genders, setGenders] = useState([]);
	const [countries, setCountries] = useState([]);
	const [country, setCountry] = useState(null);
	const [states, setStates] = useState([]);

	const [dateOfBirth, setDateOfBirth] = useState('');
	const [imageUrl, setImageUrl] = useState();
	const [imageString, setImageString] = useState();

	const [loading, setLoading] = useState(false);

	const navigate = useNavigate();
	const param = useParams();

	const [tags, setTags] = useState([]);
	const [inputVisible, setInputVisible] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const [fileList, setFileList] = useState([]);

	const fetchApis = useCallback(async () => {
		try {
			const urls = [
				FETCH_GENDERS_API,
				`${FETCH_COUNTRIES_API}?per_page=300`,
				FETCH_CATEGORIES_API,
				FETCH_SOURCES_API,
				FETCH_AFFILIATIONS_API,
			];
			const requests = urls.map(url =>
				asyncFetch(url).then(response => response.json())
			);
			const [
				rs_genders,
				rs_countries,
				rs_categories,
				rs_sources,
				rs_affiliations,
			] = await Promise.all(requests);
			setGenders(rs_genders.genders);
			setCountries(rs_countries.countries);
			setCategories(rs_categories.categories);
			setSources(rs_sources.sources);
			setAffliations(rs_affiliations.affiliations);
		} catch (error) {
			notifyWithIcon('error', error.message);
		}
	}, []);

	const fetchStates = useCallback(async country_id => {
		const rs = await request(FETCH_STATES_API.replace('/:id', ''));
		setStates(rs.states);
	}, []);

	const fetchPoi = useCallback(async id => {
		try {
			const rs = await request(GET_POI_API.replace(':id', id));

			return rs.poi_data;
		} catch (error) {
			notifyWithIcon('error', error.message);
		}
	}, []);

	const changeImage = data => {
		setImageUrl(data);
	};

	useEffect(() => {
		if (!loaded) {
			fetchApis();
			fetchPoi(param.id).then(item => {
				console.log(item);

				if (!item) {
					notifyWithIcon('error', 'poi not found!');
					navigate('/pois/poi');
					return;
				}

				if (item.alias) {
					try {
						const tagsArray = item.alias.split(',').map(tag => tag.trim());

						setAlias(tagsArray);
						setTags(tagsArray);
					} catch (error) {
						console.error('Failed to parse alias:', error);

						const jsonArray = [item.alias];
						setAlias(jsonArray);
					}
				}

				setDateOfBirth(new Date(item.dob));
				setCountry(item.country);
				setSource(item.source);
				setPoi(item);

				setImageString(item.picture);
				if (item.marital_status)
					setMaritalStatus(
						maritalStatusList.find(
							status => status.name === item.marital_status
						)
					);
				setLoaded(true);
			});
		}
	}, [
		fetchApis,
		// fetchDepartments,
		fetchPoi,
		// fetchLgas,
		// fetchUnits,
		loaded,
		navigate,
		param.id,
	]);

	const handleClose = removedTag => {
		const newTags = tags.filter(tag => tag !== removedTag);
		setTags(newTags);
	};

	const showInput = () => {
		setInputVisible(true);
	};

	const handleInputChange = e => {
		setInputValue(e.target.value);
	};

	const handleInputConfirm = () => {
		if (inputValue && tags.indexOf(inputValue) === -1) {
			setTags([...tags, inputValue]);
		}
		setInputVisible(false);
		setInputValue('');
	};

	const forMap = tag => (
		<span key={tag} style={{ display: 'inline-block' }}>
			<Tag closable onClose={() => handleClose(tag)}>
				{tag}
			</Tag>
		</span>
	);

	const tagChild = tags.map(forMap);

	// Function to convert null or undefined values to an empty string
	const convertNullToEmptyString = obj => {
		for (let key in obj) {
			if (obj[key] === null || obj[key] === undefined) {
				obj[key] = ''; // Convert null or undefined to an empty string
			}
		}
	};

	const onSubmit = async values => {
		convertNullToEmptyString(values);

		try {
			// Create a FormData object
			const formData = new FormData();
			// Append your values to FormData

			if (country) values.country_id = country.id;
			if (maritalStatus) values.marital_status = maritalStatus.name;
			if (dateOfBirth) values.dob = dateOfBirth;
			if (tags) values.alias = tags;

			for (const key in values) {
				formData.append(key, values[key]);
			}

			// Function to append to formData only if the value exists
			const appendIfExists = (key, value) => {
				if (value !== undefined && value !== null) {
					formData.append(key, value);
				}
			};

			// Conditionally append values to FormData, with empty strings for non-existent values
			if (values.category) {
				formData.append('category_id', values.category.id);
			}

			if (values.source) {
				formData.append('source_id', values.source?.id || '');
			}
			if (values.gender) {
				formData.append('gender_id', values.gender?.id || '');
			}
			if (values.state) {
				formData.append('state_id', values.state?.id || '');
			}
			if (values.affiliation) {
				formData.append('affiliation_id', values.affiliation?.id || '');
			}
			if (values.marital_status) {
				formData.append('marital_status', values.marital_status?.name || '');
			}
			if (imageUrl) {
				formData.append('picture', imageUrl?.file || ''); // Ensure imageUrl is not null
			}
			if (tags) {
				formData.append('alias', tags.length > 0 ? tags.join(', ') : ''); // Ensure alias is not null
			}

			// for (let pair of formData.entries()) {
			// 	console.log(`${pair[0]}: ${pair[1]}`);
			// }

			// return

			const uri = UPDATE_POI_API.replace(':id', param.id);

			const headers = createHeaders(true);
			const response = await fetch(uri, {
				method: 'PUT',
				body: formData,
				headers: headers,
			});

			const data = await response.json();

			if (data.error) {
				let errorMessage = data.error;

				notifyWithIcon('error', errorMessage);
			} else {
				notifyWithIcon('success', 'POI updated successfully');
				navigate('/pois/poi');
			}
		} catch (e) {
			return { [FORM_ERROR]: e.message || 'could not create Poi' };
		}
	};

	return (
		<div className="container-fluid">
			<Breadcrumbs pageTitle="EDIT POI" parentPage="POI" />
			<div className="row">
				<Form
					initialValues={{
						...poi,
						affiliation_id: poi?.affiliation,
					}}
					onSubmit={onSubmit}
					validate={values => {
						const errors = {};

						return errors;
					}}
					render={({ handleSubmit, submitError, submitting, form }) => (
						<FormWrapper onSubmit={handleSubmit} submitting={submitting}>
							<div className="row">
								<div className="col-lg-12">
									<FormSubmitError error={submitError} />
								</div>
								<div className="col-lg-8">
									<div className="card">
										<div className="card-header">
											<h5 className="card-title mb-0">Personal Information</h5>
										</div>
										<div className="card-body">
											<div className="row">
												<div className="col-lg-12 mb-3">
													<label className="form-label" htmlFor="ref_numb">
														Reference Number{' '}
														<span style={{ color: 'red' }}>*</span>
													</label>
													<Field id="ref_numb" name="ref_numb">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="ref_numb"
																placeholder="Enter Reference number"
															/>
														)}
													</Field>
													<ErrorBlock name="ref_numb" />
												</div>
												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="first_name">
														First Name <span style={{ color: 'red' }}>*</span>
													</label>
													<Field id="first_name" name="first_name">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="first_name"
																placeholder="Enter first name"
															/>
														)}
													</Field>
													<ErrorBlock name="first_name" />
												</div>
												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="middle_name">
														Middle Name
													</label>
													<Field id="middle_name" name="middle_name">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="middle_name"
																placeholder="Enter middle name"
															/>
														)}
													</Field>
												</div>
												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="last_name">
														Last Name <span style={{ color: 'red' }}>*</span>
													</label>
													<Field id="last_name" name="last_name">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="last_name"
																placeholder="Enter last name"
															/>
														)}
													</Field>
													<ErrorBlock name="last_name" />
												</div>
												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="alias">
														Alias <span style={{ color: 'red' }}></span>
													</label>
													<Field id="alias" name="alias">
														{({ input, meta }) => (
															<div className={`form-control ${error(meta)}`}>
																{tagChild}
																{inputVisible && (
																	<Input
																		type="text"
																		size="small"
																		value={inputValue}
																		onChange={handleInputChange}
																		onBlur={handleInputConfirm}
																		onPressEnter={handleInputConfirm}
																		style={{
																			width: 78,
																			marginRight: 8,
																			marginTop: 5,
																		}}
																	/>
																)}
																{!inputVisible && (
																	<Tag
																		onClick={showInput}
																		className="site-tag-plus"
																	>
																		<i className="ri-add-line" /> Add
																	</Tag>
																)}
																<input
																	{...input}
																	type="hidden"
																	value={tags}
																	onChange={() => {}}
																	onBlur={() => input.onBlur(tags)}
																/>
															</div>
														)}
													</Field>
													<ErrorBlock name="alias" />
												</div>

												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="phone_number">
														Phone
													</label>
													<Field id="phone_number" name="phone_number">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="phone_number"
																placeholder="Enter phone number"
															/>
														)}
													</Field>
													<ErrorBlock name="phone" />
												</div>
												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="email">
														Email
													</label>
													<Field id="email" name="email">
														{({ input, meta }) => (
															<input
																{...input}
																type="email"
																className={`form-control ${error(meta)}`}
																id="email"
																placeholder="Enter email address"
															/>
														)}
													</Field>
													<ErrorBlock name="email" />
												</div>
												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="gender">
														Gender <span style={{ color: 'red' }}>*</span>
													</label>
													<Field id="gender" name="gender">
														{({ input, meta }) => (
															<Select
																{...input}
																className={error(meta)}
																placeholder="Select gender"
																options={genders}
																getOptionValue={option => option.id}
																getOptionLabel={option => option.name}
															/>
														)}
													</Field>
													<ErrorBlock name="gender" />
												</div>
												<div className="col-lg-4 mb-3">
													<label className="form-label" htmlFor="dateOfBirth">
														Date Of Birth <span style={{ color: 'red' }}></span>
													</label>
													<Field id="dateOfBirth" name="dateOfBirth">
														{({ input, meta }) => (
															<Flatpickr
																className={`form-control ${error(meta)}`}
																options={{
																	dateFormat: 'd M, Y',
																	maxDate: new Date(),
																}}
																placeholder="Select date of birth"
																value={dateOfBirth}
																onChange={([date]) => {
																	input.onChange(
																		moment(date).format('YYYY-MM-DD')
																	);
																	setDateOfBirth(date);
																}}
															/>
														)}
													</Field>
													<ErrorBlock name="dateOfBirth" />
												</div>
												<div className="col-lg-4 mb-3">
													<label
														className="form-label"
														htmlFor="marital_status"
													>
														Marital Status
													</label>

													<Field id="marital_status" name="marital_status">
														{({ input, meta }) => (
															<Select
																{...input}
																placeholder="Select marital status"
																options={maritalStatusList}
																value={maritalStatus}
																className={error(meta)}
																getOptionValue={option => option.name}
																getOptionLabel={option => option.name}
																onChange={e => {
																	e ? input.onChange(e) : input.onChange('');
																	setMaritalStatus(e);
																}}
															/>
														)}
													</Field>
													<ErrorBlock name="marital_status" />
												</div>
											</div>
										</div>
									</div>
									<div className="card">
										<div className="card-header">
											<h5 className="card-title mb-0">Technical Information</h5>
										</div>
										<div className="card-body">
											<div className="row">
												<div className="col-lg-6 mb-3">
													<label
														className="form-label"
														htmlFor="passport_number"
													>
														Passport Number
													</label>
													<Field id="passport_number" name="passport_number">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="passport_number"
																placeholder="Enter passport no"
															/>
														)}
													</Field>
													<ErrorBlock name="passport_number" />
												</div>
												<div className="col-lg-6 mb-3">
													<label
														className="form-label"
														htmlFor="other_id_number"
													>
														Other ID Number
													</label>
													<Field id="other_id_number" name="other_id_number">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="other_id_number"
																placeholder="Enter passport no"
															/>
														)}
													</Field>
													<ErrorBlock name="other_id_number" />
												</div>
												<div className="col-lg-6 mb-3">
													<label
														className="form-label"
														htmlFor="affiliation_id"
													>
														Affiliation <span style={{ color: 'red' }}>*</span>
													</label>
													<Field id="affiliation_id" name="affiliation_id">
														{({ input, meta }) => (
															<Select
																{...input}
																className={error(meta)}
																placeholder="Select affiliation"
																options={affiliations}
																getOptionValue={option => option.id}
																getOptionLabel={option => option.name}
															/>
														)}
													</Field>
												</div>
												<div className="col-lg-6 mb-3">
													<label className="form-label" htmlFor="role">
														Role
													</label>
													<Field id="role" name="role">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="role"
																placeholder="Enter role"
															/>
														)}
													</Field>
													<ErrorBlock name="role" />
												</div>
												<div className="col-lg-6 mb-3">
													<label className="form-label" htmlFor="category">
														Category <span style={{ color: 'red' }}></span>
													</label>
													<Field id="category" name="category">
														{({ input, meta }) => (
															<Select
																{...input}
																className={error(meta)}
																placeholder="Select Category"
																options={categories}
																getOptionValue={option => option.id}
																getOptionLabel={option => option.name}
															/>
														)}
													</Field>
													<ErrorBlock name="category" />
												</div>
												<div className="col-lg-6 mb-3">
													<label className="form-label" htmlFor="source">
														Source <span style={{ color: 'red' }}></span>
													</label>
													<Field id="source" name="source">
														{({ input, meta }) => (
															<Select
																{...input}
																className={error(meta)}
																placeholder="Select source"
																options={sources}
																getOptionValue={option => option.id}
																getOptionLabel={option => option.name}
															/>
														)}
													</Field>
													<ErrorBlock name="source" />
												</div>
												<div className="col-lg-6 mb-3">
													<label className="form-label" htmlFor="country_id">
														Country <span style={{ color: 'red' }}>*</span>
													</label>
													<Field id="country_id" name="country_id">
														{({ input, meta }) => (
															<Select
																{...input}
																className={error(meta)}
																placeholder="Select country"
																options={countries}
																value={country}
																getOptionValue={option => option.id}
																getOptionLabel={option =>
																	option.en_short_name || option.name
																}
																onChange={e => {
																	e ? input.onChange(e) : input.onChange('');
																	setCountry(e);
																	setStates([]);
																	fetchStates(e.id);
																	form.change('state', undefined);
																}}
															/>
														)}
													</Field>
													<ErrorBlock name="country_id" />
												</div>
												<div className="col-lg-6 mb-3">
													<label className="form-label" htmlFor="state">
														State <span style={{ color: 'red' }}>*</span>
													</label>
													<Field id="state" name="state">
														{({ input, meta }) => (
															<Select
																{...input}
																className={error(meta)}
																placeholder="Select state"
																options={states}
																getOptionValue={option => option.id}
																getOptionLabel={option => option.name}
															/>
														)}
													</Field>
													<ErrorBlock name="state" />
												</div>
												<div className="col-lg-12 mb-3">
													<label className="form-label" htmlFor="address">
														Address
													</label>
													<Field id="address" name="address">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="address"
																placeholder="Enter address"
															/>
														)}
													</Field>
													<ErrorBlock name="address" />
												</div>
												<div className="col-lg-12 mb-3">
													<label className="form-label" htmlFor="remark">
														Remark
													</label>
													<Field id="remark" name="remark">
														{({ input, meta }) => (
															<input
																{...input}
																type="text"
																className={`form-control ${error(meta)}`}
																id="remark"
																placeholder="Enter remark"
															/>
														)}
													</Field>
													<ErrorBlock name="remark" />
												</div>
											</div>
										</div>
									</div>
									<div className="text-end mb-4">
										<Link to="/pois/poi" className="btn btn-danger w-sm me-1">
											Cancel
										</Link>
										<button type="submit" className="btn btn-success w-sm">
											Update POI
										</button>
									</div>
								</div>

								<div className="col-lg-4">
									<div className="card mb-3">
										<div className="card-header">
											<h5 className="card-title mb-0">Picture</h5>
										</div>
										<div className="card-body">
											<div className="mb-3 text-center">
												<UploadFilePicture
													imageString={imageString}
													imageUrl={imageUrl}
													changeImage={data => changeImage(data)}
													style={{ width: '200px', height: '200px' }}
												/>
											</div>
										</div>
									</div>

									{/* <div className="card">
										<div className="card-header">
											<h5 className="card-title mb-0">Crime Information</h5>
										</div>
										<div className="card-body">
											<div className="mb-3">
												<label className="form-label" htmlFor="crime_committed">
													Crime Committed <span style={{ color: 'red' }}>*</span>
												</label>
												<Field id="crime_committed" name="crime_committed">
													{({ input, meta }) => (
														<input
															{...input}
															type="text"
															className={`form-control ${error(meta)}`}
															id="crime_committed"
															placeholder="Enter Crime Committed"
														/>
													)}
												</Field>
												<ErrorBlock name="crime_committed" />
											</div>
											<div className="mb-3">
												<label
													className="form-label"
													htmlFor="crime_date"
												>
													Crime Date{' '}
													<span style={{ color: 'red' }}></span>
												</label>
												<Field
													id="crime_date"
													name="crime_date"
												>
													{({ input, meta }) => (
														<Flatpickr
															className={`form-control ${error(meta)}`}
															options={{
																dateFormat: 'd M, Y',
															}}
															placeholder="Select date of crime"
															value={dateOfEmployment}
															onChange={([date]) => {
																input.onChange(
																	moment(date).format('YYYY-MM-DD')
																);
																setDateOfEmployment(date);
															}}
														/>
													)}
												</Field>
												<ErrorBlock name="crime_date" />
											</div>
											<div className="mb-3">
												<label className="form-label" htmlFor="casualties_recorded">
													Casualties Recorded <span style={{ color: 'red' }}></span>
												</label>
												<Field id="casualties_recorded" name="casualties_recorded">
													{({ input, meta }) => (
														<input
															{...input}
															type="number"
															className={`form-control ${error(meta)}`}
															id="casualties_recorded"
															placeholder="Casualties Recorded"
														/>
													)}
												</Field>
												<ErrorBlock name="casualties_recorded" />
											</div>
											<div className="mb-3">
												<label className="form-label" htmlFor="arresting_body">
													Arresting Body <span style={{ color: 'red' }}></span>
												</label>
												<Field id="arresting_body" name="arresting_body">
													{({ input, meta }) => (
														<input
															{...input}
															type="number"
															className={`form-control ${error(meta)}`}
															id="arresting_body"
															placeholder="Arresting Body"
														/>
													)}
												</Field>
												<ErrorBlock name="arresting_body" />
											</div>
											<div className="mb-3">
												<label className="form-label" htmlFor="place_of_detention">
													Place of Detention <span style={{ color: 'red' }}></span>
												</label>
												<Field id="place_of_detention" name="place_of_detention">
													{({ input, meta }) => (
														<input
															{...input}
															type="number"
															className={`form-control ${error(meta)}`}
															id="place_of_detention"
															placeholder="Place of Detention"
														/>
													)}
												</Field>
												<ErrorBlock name="place_of_detention" />
											</div>
											<div className="mb-3">
												<label className="form-label" htmlFor="action_taken">
													Action taken <span style={{ color: 'red' }}></span>
												</label>
												<Field id="action_taken" name="action_taken">
													{({ input, meta }) => (
														<input
															{...input}
															type="number"
															className={`form-control ${error(meta)}`}
															id="action_taken"
															placeholder="Action taken"
														/>
													)}
												</Field>
												<ErrorBlock name="action_taken" />
											</div>
										</div>
									</div> */}

									{/* <div className="card">
										<div className="card-header">
											<h5 className="card-title mb-0">Arms Recovered</h5>
										</div>
										<div className="card-body">
											
										</div>
									</div> */}
								</div>
								{/* <div className="col-lg-12">
									<div className="text-end mb-4">
										<Link
											to="/employees/profiles"
											className="btn btn-danger w-sm me-1"
										>
											Cancel
										</Link>
										<button type="submit" className="btn btn-success w-sm">
											Create employee
										</button>
									</div>
								</div> */}
							</div>
						</FormWrapper>
					)}
				/>
			</div>
		</div>
	);
};

export default EditPoi;
