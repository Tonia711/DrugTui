const baseDepartmentRequestDetails = [
  {
    id: "REQ-001",
    department: "Emergency Department",
    description: "Morphine 10mg - 50 ampoules",
    requestedBy: "Dr. Sarah Williams",
    requestedDate: "2025-11-30",
    requestedTime: "08:15",
    status: "Pending Acceptance",
    medicines: [
      {
        id: "MED-001",
        name: "Morphine Sulfate",
        specification: "10mg/1mL Ampoule",
        requestedQty: 50,
        availableStock: 120,
        batchNumber: "MOR-2025-A45",
        expiryDate: "2026-06-15",
      },
    ],
  },
  {
    id: "REQ-002",
    department: "ICU",
    description: "Norepinephrine 4mg/4mL - 30 ampoules",
    requestedBy: "Dr. Michael Chen",
    requestedDate: "2025-11-30",
    requestedTime: "07:45",
    status: "Accepted / Processing",
    acceptedBy: "James Thompson",
    acceptedTime: "2025-11-30 08:00",
    medicines: [
      {
        id: "MED-002",
        name: "Norepinephrine",
        specification: "4mg/4mL Ampoule",
        requestedQty: 30,
        availableStock: 85,
        approvedQty: 30,
        batchNumber: "NOR-2025-B12",
        expiryDate: "2026-03-20",
      },
    ],
  },
  {
    id: "REQ-003",
    department: "Surgical Ward",
    description: "Cefazolin 1g - 100 vials",
    requestedBy: "Nurse Emma Thompson",
    requestedDate: "2025-11-29",
    requestedTime: "16:30",
    status: "Accepted / Processing",
    medicines: [
      {
        id: "MED-003",
        name: "Cefazolin Sodium",
        specification: "1g Vial",
        requestedQty: 100,
        availableStock: 250,
        approvedQty: 100,
        batchNumber: "CEF-2025-C78",
        expiryDate: "2026-08-10",
      },
    ],
  },
  {
    id: "REQ-004",
    department: "Pediatrics",
    description: "Amoxicillin Suspension 250mg/5mL - 20 bottles",
    requestedBy: "Dr. Lisa Anderson",
    requestedDate: "2025-11-29",
    requestedTime: "14:20",
    status: "Ready for Delivery",
    medicines: [
      {
        id: "MED-004",
        name: "Amoxicillin",
        specification: "250mg/5mL Suspension 100mL",
        requestedQty: 20,
        availableStock: 45,
        approvedQty: 20,
        batchNumber: "AMO-2025-D34",
        expiryDate: "2026-02-28",
      },
    ],
  },
  {
    id: "REQ-005",
    department: "Cardiology",
    description: "Atorvastatin 40mg - 500 tablets",
    requestedBy: "Dr. Robert Taylor",
    requestedDate: "2025-11-29",
    requestedTime: "11:00",
    status: "Dispatched",
    dispatchedBy: "Mike Wilson",
    dispatchedDate: "2025-11-29",
    dispatchedTime: "11:40",
    medicines: [
      {
        id: "MED-005",
        name: "Atorvastatin",
        specification: "40mg Tablet",
        requestedQty: 500,
        availableStock: 1200,
        approvedQty: 500,
        batchNumber: "ATO-2025-E56",
        expiryDate: "2026-12-31",
      },
    ],
  },
  {
    id: "REQ-006",
    department: "Oncology",
    description: "Ondansetron 8mg - 200 tablets",
    requestedBy: "Nurse David Martinez",
    requestedDate: "2025-11-29",
    requestedTime: "09:15",
    status: "Completed",
    dispatchedBy: "Mike Wilson",
    dispatchedDate: "2025-11-29",
    dispatchedTime: "10:00",
    completedBy: "Nurse David Martinez",
    completedDate: "2025-11-29",
    completedTime: "10:35",
    medicines: [
      {
        id: "MED-006",
        name: "Ondansetron",
        specification: "8mg Tablet",
        requestedQty: 200,
        availableStock: 520,
        approvedQty: 200,
        batchNumber: "OND-2025-F21",
        expiryDate: "2026-09-30",
      },
    ],
  },
  {
    id: "REQ-007",
    department: "Orthopedics",
    description: "Ibuprofen 600mg - 300 tablets",
    requestedBy: "Dr. Jennifer Lee",
    requestedDate: "2025-11-28",
    requestedTime: "15:45",
    status: "Pending Acceptance",
    medicines: [
      {
        id: "MED-007",
        name: "Ibuprofen",
        specification: "600mg Tablet",
        requestedQty: 300,
        availableStock: 810,
        batchNumber: "IBU-2025-G17",
        expiryDate: "2026-11-20",
      },
    ],
  },
  {
    id: "REQ-008",
    department: "Neurology",
    description: "Gabapentin 300mg - 150 capsules",
    requestedBy: "Dr. James Wilson",
    requestedDate: "2025-11-28",
    requestedTime: "13:30",
    status: "Accepted / Processing",
    medicines: [
      {
        id: "MED-008",
        name: "Gabapentin",
        specification: "300mg Capsule",
        requestedQty: 150,
        availableStock: 360,
        approvedQty: 150,
        batchNumber: "GAB-2025-H08",
        expiryDate: "2026-05-18",
      },
    ],
  },
  {
    id: "REQ-009",
    department: "Internal Medicine",
    description: "Metformin 850mg - 400 tablets",
    requestedBy: "Dr. Maria Garcia",
    requestedDate: "2025-11-28",
    requestedTime: "10:20",
    status: "Dispatched",
    dispatchedBy: "Mike Wilson",
    dispatchedDate: "2025-11-28",
    dispatchedTime: "11:10",
    medicines: [
      {
        id: "MED-009",
        name: "Metformin",
        specification: "850mg Tablet",
        requestedQty: 400,
        availableStock: 900,
        approvedQty: 400,
        batchNumber: "MET-2025-J39",
        expiryDate: "2026-07-12",
      },
    ],
  },
  {
    id: "REQ-010",
    department: "Respiratory",
    description: "Salbutamol Inhaler - 30 units",
    requestedBy: "Nurse Kevin Brown",
    requestedDate: "2025-11-27",
    requestedTime: "16:00",
    status: "Completed",
    dispatchedBy: "Mike Wilson",
    dispatchedDate: "2025-11-27",
    dispatchedTime: "17:00",
    completedBy: "Nurse Kevin Brown",
    completedDate: "2025-11-27",
    completedTime: "17:20",
    medicines: [
      {
        id: "MED-010",
        name: "Salbutamol Inhaler",
        specification: "100mcg/dose",
        requestedQty: 30,
        availableStock: 75,
        approvedQty: 30,
        batchNumber: "SAL-2025-K66",
        expiryDate: "2026-10-08",
      },
    ],
  },
  {
    id: "REQ-011",
    department: "Gastroenterology",
    description: "Omeprazole 20mg - 250 capsules",
    requestedBy: "Dr. Patricia Davis",
    requestedDate: "2025-11-27",
    requestedTime: "14:30",
    status: "Pending Acceptance",
    medicines: [
      {
        id: "MED-011",
        name: "Omeprazole",
        specification: "20mg Capsule",
        requestedQty: 250,
        availableStock: 640,
        batchNumber: "OME-2025-L55",
        expiryDate: "2026-04-25",
      },
    ],
  },
  {
    id: "REQ-012",
    department: "Dermatology",
    description: "Hydrocortisone Cream 1% - 50 tubes",
    requestedBy: "Dr. Andrew White",
    requestedDate: "2025-11-27",
    requestedTime: "11:15",
    status: "Accepted / Processing",
    medicines: [
      {
        id: "MED-012",
        name: "Hydrocortisone Cream",
        specification: "1% 30g Tube",
        requestedQty: 50,
        availableStock: 95,
        approvedQty: 50,
        batchNumber: "HYD-2025-M14",
        expiryDate: "2026-01-31",
      },
    ],
  },
  {
    id: "REQ-013",
    department: "Psychiatry",
    description: "Sertraline 50mg - 180 tablets",
    requestedBy: "Dr. Rachel Green",
    requestedDate: "2025-11-26",
    requestedTime: "15:45",
    status: "Accepted / Processing",
    medicines: [
      {
        id: "MED-013",
        name: "Sertraline",
        specification: "50mg Tablet",
        requestedQty: 180,
        availableStock: 430,
        approvedQty: 180,
        batchNumber: "SER-2025-N72",
        expiryDate: "2026-08-03",
      },
    ],
  },
  {
    id: "REQ-014",
    department: "Endocrinology",
    description: "Insulin Glargine 100u/mL - 25 pens",
    requestedBy: "Dr. Christopher Moore",
    requestedDate: "2025-11-26",
    requestedTime: "13:00",
    status: "Accepted / Processing",
    medicines: [
      {
        id: "MED-014",
        name: "Insulin Glargine",
        specification: "100u/mL Pen",
        requestedQty: 25,
        availableStock: 40,
        approvedQty: 25,
        batchNumber: "INS-2025-P09",
        expiryDate: "2026-03-10",
      },
    ],
  },
  {
    id: "REQ-015",
    department: "Rheumatology",
    description: "Methotrexate 2.5mg - 100 tablets",
    requestedBy: "Dr. Michelle Johnson",
    requestedDate: "2025-11-26",
    requestedTime: "09:30",
    status: "Dispatched",
    dispatchedBy: "Mike Wilson",
    dispatchedDate: "2025-11-26",
    dispatchedTime: "10:15",
    medicines: [
      {
        id: "MED-015",
        name: "Methotrexate",
        specification: "2.5mg Tablet",
        requestedQty: 100,
        availableStock: 250,
        approvedQty: 100,
        batchNumber: "MET-2025-Q31",
        expiryDate: "2026-09-14",
      },
    ],
  },
  {
    id: "REQ-016",
    department: "Emergency Department",
    description: "Fentanyl 100mcg - 20 ampoules",
    requestedBy: "Dr. Sarah Williams",
    requestedDate: "2025-11-25",
    requestedTime: "18:45",
    status: "Rejected",
    medicines: [
      {
        id: "MED-016",
        name: "Fentanyl Citrate",
        specification: "100mcg/2mL Ampoule",
        requestedQty: 20,
        availableStock: 8,
        batchNumber: "FEN-2025-R04",
        expiryDate: "2026-02-20",
      },
    ],
  },
  {
    id: "REQ-017",
    department: "Anesthesiology",
    description: "Propofol 1% 50mL - 15 vials",
    requestedBy: "Dr. Mark Stevens",
    requestedDate: "2025-11-25",
    requestedTime: "14:30",
    status: "Rejected",
    medicines: [
      {
        id: "MED-017",
        name: "Propofol",
        specification: "1% 50mL Vial",
        requestedQty: 15,
        availableStock: 5,
        batchNumber: "PRO-2025-S28",
        expiryDate: "2026-01-05",
      },
    ],
  },
  {
    id: "REQ-018",
    department: "Pain Management",
    description: "Hydromorphone 2mg - 30 ampoules",
    requestedBy: "Dr. Nicole Parker",
    requestedDate: "2025-11-25",
    requestedTime: "10:15",
    status: "Rejected",
    medicines: [
      {
        id: "MED-018",
        name: "Hydromorphone",
        specification: "2mg/mL Ampoule",
        requestedQty: 30,
        availableStock: 12,
        batchNumber: "HYD-2025-T52",
        expiryDate: "2026-06-01",
      },
    ],
  },
  {
    id: "REQ-019",
    department: "ICU",
    description: "Midazolam 5mg/5mL - 40 ampoules",
    requestedBy: "Dr. Thomas Clark",
    requestedDate: "2025-11-24",
    requestedTime: "16:00",
    status: "Accepted - Awaiting Restock",
    medicines: [
      {
        id: "MED-019",
        name: "Midazolam",
        specification: "5mg/5mL Ampoule",
        requestedQty: 40,
        availableStock: 14,
        approvedQty: 14,
        batchNumber: "MID-2025-U80",
        expiryDate: "2026-11-30",
      },
    ],
  },
  {
    id: "REQ-020",
    department: "Emergency Department",
    description: "Epinephrine 1mg/mL - 25 ampoules",
    requestedBy: "Dr. Sarah Williams",
    requestedDate: "2025-11-24",
    requestedTime: "12:30",
    status: "Accepted - Awaiting Restock",
    medicines: [
      {
        id: "MED-020",
        name: "Epinephrine",
        specification: "1mg/mL Ampoule",
        requestedQty: 25,
        availableStock: 10,
        approvedQty: 10,
        batchNumber: "EPI-2025-V67",
        expiryDate: "2026-08-22",
      },
    ],
  },
  {
    id: "REQ-021",
    department: "Cardiology",
    description: "Nitroglycerin Spray - 15 bottles",
    requestedBy: "Dr. Robert Taylor",
    requestedDate: "2025-11-24",
    requestedTime: "09:45",
    status: "Completed",
    dispatchedBy: "Mike Wilson",
    dispatchedDate: "2025-11-24",
    dispatchedTime: "10:30",
    completedBy: "Dr. Robert Taylor",
    completedDate: "2025-11-24",
    completedTime: "11:10",
    medicines: [
      {
        id: "MED-021",
        name: "Nitroglycerin Spray",
        specification: "0.4mg/dose",
        requestedQty: 15,
        availableStock: 40,
        approvedQty: 15,
        batchNumber: "NIT-2025-W93",
        expiryDate: "2026-12-18",
      },
    ],
  },
];

const getWorkflowStage = (status) => {
  if (status === "Completed") return 4;
  if (status === "Dispatched") return 3;
  if (status === "Ready for Delivery") return 2;
  if (
    status === "Accepted / Processing" ||
    status === "Accepted - Awaiting Restock" ||
    status === "Rejected"
  ) {
    return 1;
  }
  return 0;
};

const ensureWorkflowFields = (request) => {
  const stage = getWorkflowStage(request.status);
  const requestDateTime = `${request.requestedDate} ${request.requestedTime}`;

  const withAccepted =
    stage >= 1
      ? {
          acceptedBy: request.acceptedBy || "James Thompson",
          acceptedTime: request.acceptedTime || requestDateTime,
        }
      : {};

  const withReady =
    stage >= 2
      ? {
          readyBy: request.readyBy || "Sarah Johnson",
          readyTime: request.readyTime || requestDateTime,
        }
      : {};

  const withDispatched =
    stage >= 3
      ? {
          dispatchedBy: request.dispatchedBy || "Mike Wilson",
          dispatchedDate: request.dispatchedDate || request.requestedDate,
          dispatchedTime: request.dispatchedTime || request.requestedTime,
        }
      : {};

  const withCompleted =
    stage >= 4
      ? {
          completedBy: request.completedBy || request.requestedBy,
          completedDate: request.completedDate || request.requestedDate,
          completedTime: request.completedTime || request.requestedTime,
        }
      : {};

  return {
    ...request,
    ...withAccepted,
    ...withReady,
    ...withDispatched,
    ...withCompleted,
  };
};

export const departmentRequestDetails =
  baseDepartmentRequestDetails.map(ensureWorkflowFields);

export const departmentRequestStatuses = [
  "Pending Acceptance",
  "Accepted / Processing",
  "Accepted - Awaiting Restock",
  "Ready for Delivery",
  "Dispatched",
  "Completed",
  "Rejected",
];

export const departmentRequestById = Object.fromEntries(
  departmentRequestDetails.map((request) => [request.id, request]),
);

export const departmentRequestList = departmentRequestDetails.map(
  (request) => ({
    id: request.id,
    department: request.department,
    description: request.description,
    requestedBy: request.requestedBy,
    time: `${request.requestedDate} ${request.requestedTime}`,
    status: request.status,
  }),
);
