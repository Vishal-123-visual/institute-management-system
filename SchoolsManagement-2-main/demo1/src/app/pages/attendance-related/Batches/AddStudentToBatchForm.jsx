import {useFormik} from 'formik'
import * as Yup from 'yup'
import {useEffect, useState} from 'react'
import {useBatchContext} from '../../batch/BatchContext'
import {useAdmissionContext} from '../../../modules/auth/core/Addmission'
import {useCourseSubjectContext} from '../../course/course_subject/CourseSubjectContext'
import { useParams } from 'react-router-dom'
import { useQueryClient } from 'react-query'
import { toast } from 'react-toastify'

const validationSchema = Yup.object().shape({
  student: Yup.string().required('Student is required'),
  currentSoftware: Yup.string().required('Current software is required'),
  subject: Yup.array().min(1, 'Select at least one subject').required(),
})

const AddStudentToBatchForm = ({batch, onSuccess}) => {
  const [existingStudents, setExistingStudents] = useState()
  const {useAddStudentToBatch} = useBatchContext()
  const {studentsLists,GetStudentsByCompanyAndCourse} = useAdmissionContext()
  const addStudentMutation = useAddStudentToBatch()
  const ctx = useCourseSubjectContext()
  const queryClient = useQueryClient()
  const [selectedStudentId,setSelectedStudentId] = useState(null)
  // console.log('first', subjects)


  const courseCategoryId = batch?.courseCategory

  //console.log('batch',batch)
  //console.log('id',selectedStudentId)
  // filter subjects by courseId 

  // const subjects = ctx.getCourseSubjectLists?.data?.filter((sub)=> sub.course === courseId || sub.course?._id === courseId) || []

  // filter students by courseId 
  const allStudents = studentsLists.data.users?.filter((stu)=> stu.courseName.category ===courseCategoryId) || []
  // console.log('filter',allStudents)
  useEffect(() => {
    if (batch?.students) {
      setExistingStudents(batch.students.map((s) => s.student?._id || s.student))
    }
  }, [batch])
  const availableStudents =
    allStudents?.filter((student) => !existingStudents?.includes(student._id)) || []
  //console.log('available stu', availableStudents)

  const formik = useFormik({
    initialValues: {
      student: '',
      subject: [],
      currentSoftware: '',
    },
    validationSchema,
    onSubmit: (values) => {
      console.log('values', values)
      const payload = {
        studentId: values.student,
        currentSoftware: values.currentSoftware,
        subjects: formik.values.subject.map((id) => ({subject: id})),
        // subjects: [
        //   {
        //     subject: values.subject,
        //   },
        // ],
        // currentSoftware:
      }

      addStudentMutation.mutate(
        {batchId: batch._id, payload},
        {
          onSuccess: () => {
            queryClient.invalidateQueries(['batches'])
            queryClient.invalidateQueries(['batch',batch._id])
            formik.resetForm()
            onSuccess?.()
          },
          onError: (error)=>{
            toast.error(error?.response?.data?.message)
          }
        }
      )
    },
  
  })

//   console.log('student', formik.values.student)
//   console.log(formik.values.student , courseCategoryId
// )
  //const {data : subjects = []} = ctx.useGetStudentSubjects(formik.values.student , batch.course )
  const {data : subjects = []} = ctx.useGetStudentSubjectsBasedOnCategory(formik.values.student , courseCategoryId )
 //console.log('sub',subjects)
 //console.log('sub1',subjects)
//console.log('availstu',availableStudents)
  //console.log('subjects',ctx.getCourseSubjectLists?.data)
  return (
    <form onSubmit={formik.handleSubmit}>
      <div className='row mb-6'>
        <label className='col-12 col-form-label required fw-bold fs-6'>Select Student</label>
        <div className='col-12 fv-row'>
          <select
            className={`form-select form-select-lg form-select-solid ${
              formik.touched.student && formik.errors.student ? 'is-invalid' : ''
            }`}
            {...formik.getFieldProps('student')}
            // onChange={(e)=>setSelectedStudentId(e.target.value)}
          >
            <option value='' hidden>Select Student</option>
            {availableStudents.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name}
              </option>
            ))}
          </select>
          {formik.touched.student && formik.errors.student && (
            <div className='invalid-feedback'>{formik.errors.student}</div>
          )}
          {availableStudents.length === 0 && (
            <small className='text-warning d-block mt-2'>
              All available students are already enrolled in this batch.
            </small>
          )}
        </div>
      </div>
      {/* select subject  */}
      <div className='row mb-6'>
        <label className='col-12 col-form-label required fw-bold fs-6'>Subjects</label>

        <div className='d-flex flex-column '>
          {subjects?.data?.map((sub,i) => (
            <div key={sub?.Subjects?._id+i} className=' d-flex flex-column align-items-start form-check mb-2'>
              {
                sub?.subjects?.map((item,i)=>(
                <div key={item.subject?._id}>
                   <input
                    type='checkbox'
                    className='form-check-input'
                    id={item?.subject?._id}
                    checked={formik.values.subject.includes(item?.subject?._id)}
                    onChange={(e) => {
                      let updated = [...formik.values.subject]
    
                      if (e.target.checked) {
                        updated.push(item?.subject?._id)
                      } else {
                        updated = updated.filter((id) => id !== item?.subject?._id)
                      }
    
                      formik.setFieldValue('subject', updated)
                    }}
                  />
                  <label className='form-check-label' htmlFor={item?.subject?._id}>
                    {item?.subject?.subjectName}
                  </label>
                </div>
                 ))
              }
            </div>
          ))}

          {formik.touched.subject && formik.errors.subject && (
            <div className='invalid-feedback d-block'>{formik.errors.subject}</div>
          )}

          <small className='text-muted d-block mt-2'>Select one or more subjects.</small>
        </div>
      </div>
      
      {/* current software  */}
      <div className='row mb-6'>
        <label className='col-12 col-form-label required fw-bold fs-6'>Current Software</label>
        <div className='col-12 fv-row'>
          <input
            type='text'
            className={`form-control form-control-lg form-control-solid ${
              formik.touched.currentSoftware && formik.errors.currentSoftware ? 'is-invalid' : ''
            }`}
            placeholder='Enter current software name (e.g., Adobe Photoshop)'
            {...formik.getFieldProps('currentSoftware')}
          />
          {formik.touched.currentSoftware && formik.errors.currentSoftware && (
            <div className='invalid-feedback'>{formik.errors.currentSoftware}</div>
          )}
          <small className='text-muted d-block mt-2'>
            This is the software the student will be learning in this batch.
          </small>
        </div>
      </div>

      <div className='row'>
        <div className='col-12'>
          <button
            type='submit'
            className='btn btn-primary w-100'
            disabled={addStudentMutation.isLoading || availableStudents.length === 0}
          >
            {addStudentMutation.isLoading ? (
              <span
                className='spinner-border spinner-border-sm me-2'
                role='status'
                aria-hidden='true'
              ></span>
            ) : null}
            Add Student to Batch
          </button>
        </div>
      </div>

      {addStudentMutation.error && (
        <div className='alert alert-danger mt-3'>
          {addStudentMutation.error?.message || 'Error adding student to batch'}
        </div>
      )}
    </form>
  )
}

export default AddStudentToBatchForm
