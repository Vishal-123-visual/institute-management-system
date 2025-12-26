const BatchReport = ({batches, onBack}) => {
  return (
    <div>
      {batches?.data?.map((batch, i) => (
        <div key={batch._id + i} className='mb-5'>
          {/* Header */}
          <div className='d-flex flex-wrap justify-content-between align-items-center mb-4'>
            <h4 className='mb-2'>Batch Report - {batch?.name}</h4>
            <div>
              <button className='btn btn-light me-2 mb-2' onClick={onBack}>
                Back
              </button>
              <button className='btn btn-success mb-2'>Export PDF</button>
            </div>
          </div>

          {/* Batch Info */}
          <div className='card mb-3'>
            <div className='card-body'>
              <div className='row g-3'>
                <div className='col-md-3 col-sm-6'>
                  <strong>Trainer:</strong>
                  <br />
                  {batch?.trainer?.trainerName || 'N/A'}
                </div>
                <div className='col-md-3 col-sm-6'>
                  <strong>Time:</strong>
                  <br />
                  {batch?.startTime} - {batch?.endTime}
                </div>
                <div className='col-md-3 col-sm-6'>
                  <strong>Start Date:</strong>
                  <br />
                  {batch?.startDate?.slice(0, 10)}
                </div>
                <div className='col-md-3 col-sm-6'>
                  <strong>End Date:</strong>
                  <br />
                  {batch?.endDate?.slice(0, 10)}
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className='card'>
            <div className='card-body'>
              <h5 className='mb-3'>Students</h5>

              {batch?.students?.length > 0 ? (
                <div className='table-responsive'>
                  <table className='table table-bordered table-striped align-middle'>
                    <thead className='table-light'>
                      <tr>
                        <th>Sr No</th>
                        <th>Batch Name</th>
                        <th>Time</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Trainer</th>
                        <th>Student Name</th>
                        <th>Course</th>
                        <th>Software</th>
                        {/* <th>Total Subjects</th>
                        <th>Progress</th> */}
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {batch.students.map((item, index) => {
                        // console.log('item', item)
                        // const totalSubjects = item.subjects.length
                        // const avgProgress =
                        //   totalSubjects > 0
                        //     ? Math.round(
                        //         item.subjects.reduce((sum, s) => sum + (s.progress || 0), 0) /
                        //           totalSubjects
                        //       )
                        //     : 0

                        return (
                          <tr key={item._id}>
                            <td>{index + 1}</td>
                            <td>{batch?.name}</td>
                            <td>
                              {batch?.startTime} - {batch?.endTime}
                            </td>
                            <td>{batch?.startDate?.slice(0, 10)}</td>
                            <td>{batch?.endDate?.slice(0, 10)}</td>
                            <td>{batch?.trainer?.trainerName}</td>
                            <td>{item.student?.name}</td>
                            <td>{item.student?.courseName?.courseName || 'N/A'}</td>
                            <td>
                              {item.subjects.map((sub) => sub.subject?.subjectName).join(', ')}
                            </td>
                            {/* <td>{totalSubjects}</td> */}
                            {/* <td>{avgProgress}%</td> */}
                            <td>{batch?.status}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='alert alert-info'>No students enrolled</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default BatchReport
