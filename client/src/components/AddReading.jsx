
import { useState } from 'react';
import { createReading } from '../services/readingService';

const getLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

function AddReading({ onReadingAdded }) {
  const [formData, setFormData] = useState({
    glucose_level: '',
    meal_context: 'morning',
    measured_at: getLocalDateTime(),
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const level = Number(formData.glucose_level);

    if (!Number.isInteger(level) || level < 40 || level > 600) {
      setError('Glucose level must be an integer between 40 and 600.');
      return;
    }

    setLoading(true);

    try {
      await createReading({
        ...formData,
        glucose_level: level,
        measured_at: new Date(formData.measured_at).toISOString(),
        notes: formData.notes.trim(),
      });

      setSuccess('Glucose reading added successfully!');

      setFormData({
        glucose_level: '',
        meal_context: 'morning',
        measured_at: getLocalDateTime(),
        notes: '',
      });

      if (onReadingAdded) {
        await onReadingAdded();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to add reading. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="report-section">
      <h2>Add Glucose Reading</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="reading-form">
        <label>Glucose Level (mg/dL)</label>
        <input
          type="number"
          name="glucose_level"
          placeholder="Enter glucose level"
          min="40"
          max="600"
          step="1"
          value={formData.glucose_level}
          onChange={handleChange}
          required
        />

        <label>Measurement Slot</label>
        <select
          name="meal_context"
          value={formData.meal_context}
          onChange={handleChange}
          required
        >
          <option value="morning">Morning (Fasting)</option>
          <option value="after_breakfast">After Breakfast</option>
          <option value="after_lunch">After Lunch</option>
          <option value="after_dinner">After Dinner</option>
        </select>

        <label>Date and Time</label>
        <input
          type="datetime-local"
          name="measured_at"
          value={formData.measured_at}
          onChange={handleChange}
          max={getLocalDateTime()}
          required
        />

        <label>Notes (Optional)</label>
        <textarea
          name="notes"
          placeholder="Add any notes..."
          value={formData.notes}
          onChange={handleChange}
          maxLength={500}
          rows={3}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Add Reading'}
        </button>
      </form>
    </section>
  );
}

export default AddReading;
