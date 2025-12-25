
import * as XLSX from "xlsx";


const BatchReport = ({ batch, onBack }) => {
    const exportToExcel = () => {
  if (!batch) return;

  const rows = [];

  batch.students.forEach((studentItem) => {
    const studentName =
      studentItem.student?.name ||
      `${studentItem.student?.firstName || ""} ${studentItem.student?.lastName || ""}`.trim();

    const courseName =
      studentItem.student?.courseName?.courseName || "N/A";

    studentItem.subjects.forEach((sub) => {
      const progressData = batch.subjects?.find(
        (bSub) => bSub.subject === sub._id
      );

      rows.push({
        "Batch Name": batch.name,
        "Trainer": batch.trainer?.trainerName || "N/A",
        "Student Name": studentName,
        "Course": courseName,
        "Subject": sub.subjectName,
        "Status": progressData?.status || "N/A",
        "Progress (%)": progressData?.progress ?? 0,
        "Start Date": batch.startDate?.split("T")[0],
        "End Date": batch.endDate?.split("T")[0],
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Report");

  XLSX.writeFile(workbook, `${batch.name}-Batch-Report.xlsx`);
};

console.log('all batch',batch)
  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-5'>
        <h4 className='mb-0'>Batch Report - {batch?.name}</h4>
        <div>
          <button className='btn btn-light me-2' onClick={onBack}>Back</button>
          <button className='btn btn-success' onClick={exportToExcel}>Export Excel</button>
        </div>
      </div>

      <div className='card'>
        <div className='card-body'>
          <p><strong>Trainer:</strong> {batch?.trainer?.trainerName || 'N/A'}</p>
          <p><strong>Start Date:</strong> {batch?.startDate || 'N/A'}</p>
          <p><strong>End Date:</strong> {batch?.endDate || 'N/A'}</p>

          <hr />

          <h5>Students</h5>
          
            <table className='table'>
              <thead>
                <tr>
                  <th>Batch Name </th>
                  <th>Name</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {/* {batch.students.map((s, i) => (
                  <tr key={s.id || i}>
                    <td>{i + 1}</td>
                    <td>{(s.student?.firstName || s.firstName) + (s.student?.lastName ? ' ' + s.student.lastName : '')}</td>
                    <td>{s.progress || '-'}</td>
                  </tr>
                ))} */}
              </tbody>
            </table>
       
            <div className='alert alert-info'>No students enrolled</div>
         
        </div>
      </div>
    </div>
  )
}

export default BatchReport
