import React, { useCallback, useEffect, useState } from 'react';

import { APP_SHORT_NAME, limit, paginate } from '../../services/constants';
import Breadcrumbs from '../../components/Breadcrumbs';
import AppPagination from '../../components/AppPagination';
import NoResult from '../../components/NoResult';
import ManageAffiliationSetup from '../../modals/ManageAffiliationSetup';
import TableWrapper from '../../container/TableWrapper';
import {
	confirmAction,
	notifyWithIcon,
	request,
} from '../../services/utilities';
import { useQuery } from '../../hooks/query';
import { DeleteButton, EditButton } from '../../components/Buttons';
import TitleSearchBar from '../../components/TitleSearchBar';
import {
	DELETE_AFFILIATIONS_API,
	FETCH_AFFILIATIONS_API,
} from '../../services/api';

const Affiliations = () => {
	document.title = `Affiliations - ${APP_SHORT_NAME}`;

	const [fetching, setFetching] = useState(true);
	const [working, setWorking] = useState(false);
	const [list, setList] = useState([]);
	const [meta, setMeta] = useState(paginate);
	const [showModal, setShowModal] = useState(false);
	const [affiliation, setAffiliation] = useState(null);

	const [page, setPage] = useState(null);
	const [search, setSearch] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [queryLimit, setQueryLimit] = useState(limit);

	const query = useQuery();

	const fetchAffiliations = useCallback(async (per_page, page, q) => {
		try {
			const rs = await request(
				`${FETCH_AFFILIATIONS_API}?per_page=${per_page}&page=${page}&q=${q}`
			);
			const { affiliations, ...rest } = rs;
			setList(affiliations);
			setMeta({ ...rest, per_page });
		} catch (e) {
			notifyWithIcon(
				'error',
				e.message || 'error, could not fetch affiliations'
			);
		}
	}, []);

	useEffect(() => {
		const _page = Number(query.get('page') || 1);
		const _search = query.get('q') || '';
		const _limit = Number(query.get('entries_per_page') || limit);

		if (
			fetching ||
			_page !== page ||
			_search !== search ||
			_limit !== queryLimit
		) {
			if (_page !== page || _search !== search || _limit !== queryLimit) {
				setFetching(true);
			}

			fetchAffiliations(_limit, _page, _search).then(_ => {
				setFetching(false);
				setPage(_page);
				setSearch(_search);
				setSearchTerm(_search);
				setQueryLimit(_limit);
			});
		}
	}, [fetchAffiliations, fetching, page, query, queryLimit, search]);

	const confirmRemove = item => {
		confirmAction(doRemove, item, 'You want to delete this affiliation');
	};
	const doRemove = async item => {
		try {
			setWorking(true);
			const config = { method: 'DELETE' };
			const uri = DELETE_AFFILIATIONS_API.replaceAll(':id', item.id);
			const rs = await request(uri, config);
			console.log(rs);
			refreshTable();
			notifyWithIcon('success', rs.message);
			setWorking(false);
		} catch (e) {
			notifyWithIcon(
				'error',
				e.message || 'error, could not delete affiliation'
			);
			setWorking(false);
		}
	};

	const refreshTable = async () => {
		setWorking(true);
		const _limit = Number(query.get('entries_per_page') || limit);
		await fetchAffiliations(_limit, 1, '');
	};

	const addAffiliation = () => {
		document.body.classList.add('modal-open');
		setShowModal(true);
	};

	const editAffiliation = item => {
		document.body.classList.add('modal-open');
		setAffiliation(item);
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setAffiliation(null);
		document.body.classList.remove('modal-open');
	};

	return (
		<div className="container-fluid">
			<Breadcrumbs pageTitle="Affiliations" parentPage="Setup" />
			<div className="row">
				<div className="col-lg-12">
					<div className="card">
						<TitleSearchBar
							title="Affiliations"
							onClick={() => addAffiliation()}
							queryLimit={queryLimit}
							search={search}
							searchTerm={searchTerm}
							onChangeSearch={e => setSearchTerm(e.target.value)}
							hasCreateBtn={true}
							createBtnTitle="Add Affiliation"
						/>
						<div className="card-body">
							<TableWrapper
								className="table-responsive table-card"
								fetching={fetching}
								working={working}
							>
								<table className="table align-middle table-nowrap">
									<thead className="table-light">
										<tr>
											<th>S/N</th>
											<th>Name</th>
											<th>Description</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody className="list">
										{list.map((item, i) => {
											return (
												<tr key={item.id}>
													<td>{i + 1}</td>
													<td>{item.name}</td>
													<td>{item.description}</td>
													<td className="text-end">
														<div className="hstack gap-3 flex-wrap text-end">
															<EditButton
																onClick={() => editAffiliation(item)}
															/>
															{/* <DeleteButton
																onClick={() => confirmRemove(item)}
															/> */}
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
								{list.length === 0 && (
									<div className="noresult py-5">
										<NoResult title="Affiliations" />
									</div>
								)}
							</TableWrapper>
							<div className="align-items-center mt-2 g-3 text-center text-sm-start row">
								<AppPagination meta={meta} />
							</div>
						</div>
					</div>

					{showModal && (
						<ManageAffiliationSetup
							closeModal={() => closeModal()}
							affiliation={affiliation}
							update={async () => {
								await refreshTable().then(_ => setWorking(false));
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default Affiliations;
