import { useRef, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

import { db, auth } from '../firebase/config'

const LOCATIONS = [
  'Library', 'Atrium', 'Auditorium', 'A Block Mess', 'CCD', 'C Block',
  'B Block', 'Chai Adda', 'Learners Arena', 'Pushpa Devi Mess',
  'Football Ground', 'Basketball Court', 'Tennis Court',
  'Main Ground', 'R1', 'R2', 'R3', 'Other',
]

const CATEGORIES = [
  'ID Card', 'Wallet', 'Phone', 'Earphones', 'Laptop',
  'Bottle', 'Keys', 'Bag', 'Charger',
  'Stationery', 'Clothing', 'Other',
]

function FieldError({ msg }) {
  return msg
    ? <p className="field-error">{msg}</p>
    : null
}

function PostItem() {

  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [type, setType] = useState('lost')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [locationDetail, setLocationDetail] = useState('')


  const [date, setDate] = useState('')

  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const today = new Date()
    .toISOString()
    .split('T')[0]

  async function uploadImage(file) {

    const formData = new FormData()

    formData.append('file', file)
    formData.append('upload_preset', 'uzpkwhpn')

    const res = await fetch(
      'https://api.cloudinary.com/v1_1/dr1nh9u6e/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await res.json()

    if (!data.secure_url) {
      throw new Error('Image upload failed.')
    }

    return data.secure_url
  }

  function validate() {

    const errors = {}

    if (!title.trim()) {

      errors.title = 'Item name is required.'
    } else if (title.trim().length < 3) {
      errors.title = 'Minimum 3 characters.'
    }

    if (!description.trim()) {
      errors.description = 'Description is required.'
    } else if (description.trim().length < 10) {
      errors.description = 'Add more detail.'
    }

    if (!category) {
      errors.category = 'Select a category.'
    }

    if (date && date > today) {
      errors.date = 'Date cannot be in the future.'
    }

    // locationDetail is optional; only validate if user typed a specific detail
    if (!location && locationDetail.trim()) {
      errors.location = 'Select a location.'
    }




    if (
      image &&
      image.size > 5 * 1024 * 1024
    ) {
      errors.image = 'Image must be under 5MB.'
    }

    return errors
  }

  function handleBlur(field) {

    const errors = validate()

    setFieldErrors(prev => ({
      ...prev,
      [field]: errors[field],
    }))
  }

  function handleImageChange(e) {

    const file = e.target.files[0]

    if (!file) return

    setImage(file)

    const reader = new FileReader()

    reader.onloadend = () => {
      setImagePreview(reader.result)
    }

    reader.readAsDataURL(file)

    setFieldErrors(prev => ({
      ...prev,
      image: undefined,
    }))
  }

  function removeImage() {

    setImage(null)
    setImagePreview(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e) {

    e.preventDefault()

    setSubmitError('')

    if (!auth.currentUser) {
      navigate('/login')
      return
    }

    const errors = validate()

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {

      let imageUrl = ''

      if (image) {
        imageUrl = await uploadImage(image)
      }

      const fullLocation =
        locationDetail.trim() && location
          ? `${location} — ${locationDetail.trim()}`
          : location || 'Location unknown'

      const itemDate = date || 'Date unknown'

      await addDoc(collection(db, 'items'), {
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        location: fullLocation,
        date: itemDate,

        imageUrl,
        status: 'active',
        postedBy: auth.currentUser.uid,
        postedByEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
      })

      setSuccess(true)

      setTimeout(() => {
        navigate('/browse')
      }, 1200)

    } catch (err) {

      setSubmitError(
        err.message || 'Something went wrong.'
      )

    }

    setLoading(false)
  }

  return (
    <div className="container-sm post-page">

      <h2 className="heading-lg mb-1">
        Post an Item
      </h2>

      <p className="text-muted text-sm mb-4">
        Report something you lost or found on campus.
      </p>

      {submitError && (
        <div className="auth-error mb-3">
          {submitError}
        </div>
      )}

      {success && (
        <div className="success-box mb-3">
          Posted successfully. Redirecting...
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-md"
      >

        {/* Type */}
        <div className="flex gap-sm">

          {['lost', 'found'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`btn ${
                type === t
                  ? 'btn-primary'
                  : 'btn-outline'
              } toggle-btn`}
            >
              {t === 'lost'
                ? 'Lost'
                : 'Found'}
            </button>
          ))}

        </div>

        {/* Title */}
        <div>

          <label className="form-label">
            Item Name
          </label>

          <input
            type="text"
            placeholder="Blue water bottle"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => handleBlur('title')}
            className={`input-field ${
              fieldErrors.title
                ? 'input-error'
                : ''
            }`}
          />

          <FieldError msg={fieldErrors.title} />

        </div>

        {/* Description */}
        <div>

          <label className="form-label">
            Description
          </label>

          <textarea
            rows={3}
            placeholder="Color, brand, identifying marks..."
            value={description}
            onChange={e =>
              setDescription(e.target.value)
            }
            onBlur={() =>
              handleBlur('description')
            }
            className={`input-field ${
              fieldErrors.description
                ? 'input-error'
                : ''
            }`}
          />

          <FieldError msg={fieldErrors.description} />

        </div>

        {/* Category + Date */}
        <div className="flex gap-md flex-wrap">

          <div className="flex-1">

            <label className="form-label">
              Category
            </label>

            <select
              value={category}
              onChange={e =>
                setCategory(e.target.value)
              }
              className={`input-field ${
                fieldErrors.category
                  ? 'input-error'
                  : ''
              }`}
            >

              <option value="">
                Select category
              </option>

              {CATEGORIES.map(category => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}

            </select>

            <FieldError msg={fieldErrors.category} />

          </div>

          <div className="flex-1">

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '0.3rem', display: 'block' }}>
                Date lost/found <span style={{ color: '#bbb' }}>(optional — leave blank if unsure)</span>
              </label>
              <input
                type="date"
                max={today}
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`input-field ${
                  fieldErrors.date
                    ? 'input-error'
                    : ''
                }`}
              />
              <FieldError msg={fieldErrors.date} />
            </div>


          </div>

        </div>

          {/* Location */}
          <div>

          <label className="form-label" style={{ fontSize: '0.95rem' }}>
            Location
          </label>


          <div className="flex flex-col gap-xs">

            <select
              value={location}
              onChange={e =>
                setLocation(e.target.value)
              }
              className={`input-field ${
                fieldErrors.location
                  ? 'input-error'
                  : ''
              }`}
            >

              <option value="">
                Not sure / Unknown location
              </option>


              {LOCATIONS.map(location => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}

            </select>

            {location && (
              <input
                type="text"
                placeholder="Specific spot (optional)"
                value={locationDetail}
                onChange={e =>
                  setLocationDetail(e.target.value)
                }
                className="input-field text-sm"
              />
            )}

          </div>

          <FieldError msg={fieldErrors.location} />

        </div>


        {/* Image */}
        <div>

          <label className="form-label">
            Photo (Optional)
          </label>

          {!imagePreview ? (

            <label className="dropzone flex flex-col align-center">

              <span className="upload-title">
                Click to upload photo
              </span>

              <span className="text-xs text-light mt-1">
                Max 5MB · JPG, PNG, WEBP
              </span>

              <input
                hidden
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

            </label>

          ) : (

            <div className="card preview-card">

              <img
                src={imagePreview}
                alt="Preview"
                className="dropzone-img"
              />

              <button
                type="button"
                onClick={removeImage}
                className="btn-action danger-solid remove-btn"
              >
                Remove
              </button>

            </div>

          )}

          <FieldError msg={fieldErrors.image} />

        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || success}
          className="btn btn-primary submit-btn"
        >

          {loading
            ? 'Posting...'
            : success
            ? 'Posted'
            : `Report ${
                type === 'lost'
                  ? 'Lost'
                  : 'Found'
              } Item`}

        </button>

      </form>

    </div>
  )
}

export default PostItem