import { Router } from "express";
import patientCRUD from "./patientCRUD.js";
import patientFavorites from "./patientFavorites.js";
import patientDocuments from "./patientDocuments.js";
import patientAccessRequests from "./patientAccessRequests.js";
import patientMedications from "./patientMedications.js";
import patientPrescriptions from "./patientPrescriptions.js";
import patientManualRecords from "./patientManualRecords.js";

const router = Router();

// Mount sub-routes
router.use("/", patientCRUD);
router.use("/", patientFavorites);
router.use("/", patientDocuments);
router.use("/", patientAccessRequests);
router.use("/", patientMedications);
router.use("/", patientPrescriptions);
router.use("/", patientManualRecords);

export default router;
