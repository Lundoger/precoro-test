export type Pagination = {
	total: number
	count: number
	perPage: number
	currentPage: number
	totalPages: number
}

export type User = {
	id: number
	email: string
	fullName: string
}

export type UsersResponse = {
	ok: true
	data: User[]
	meta: {
		pagination: Pagination
	}
}

export type DocumentItem = {
	id: number
	name: string
}

export type ApprovalStep = {
	id: number
	documentId: number
	stepNumber: number
	stepName: string
}

export type DataResponse = {
	ok: true
	data: {
		approvalSteps: ApprovalStep[]
		documents: DocumentItem[]
	}
}

export type UpdatePayload = {
	vacationMode: {
		enable: true
		startDate: number
		endDate: number
	}
	substituteUser: number
	backupApprovers: {
		id: number
		backupApproverId: number
	}[]
}

export type UpdateResponse = {
	ok: true
}

