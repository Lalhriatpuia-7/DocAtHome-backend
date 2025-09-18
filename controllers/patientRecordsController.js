import patientRecord from "../models/patientRecord";

const createPatientRecord = async (req, res) => {
  try {
    const { patientId, records } = req.body;        
    const newRecord = new patientRecord({ patient: patientId, records });
    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } 
};

const getPatientRecords = async (req, res) => {
    try {   
        const records = await patient
        .find({ patient: req.params.patientId })
        .populate("patient", "name email")
        .exec();    
        if (!records) {
            return res.status(404).json({ message: "No records found for this patient." });
        }   
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}   
const editPatientRecord = async (req, res) => {
    try {
        const { records } = req.body;   
        const updatedRecord = await patientRecord
        .findByIdAndUpdate(
            req.params.recordId,
            { records },
            { new: true }
        )   
        .populate("patient", "name email")
        .exec();    
        if (!updatedRecord) {
            return res.status(404).json({ message: "Record not found." });
        }   
        res.json(updatedRecord);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }       
};

const deletePatientRecord = async (req, res) => {
    try {
        const deletedRecord = await patientRecord.findByIdAndDelete(req.params.recordId);   
        if (!deletedRecord) {
            return res.status(404).json({ message: "Record not found." });
        }   

        res.json({ message: "Record deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }       
};  

export { createPatientRecord, getPatientRecords, editPatientRecord, deletePatientRecord };