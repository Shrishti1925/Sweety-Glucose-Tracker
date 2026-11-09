
import { useState } from 'react';
import {
  updateReading,
  deleteReading,
} from '../services/readingService';

const formatDateTime = (value) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

function ReadingList({ readings, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const startEditing = (reading) => {
    setEditingId(reading.id);
    setError('');

    setFormData({
      glucose_level: reading.glucose_level,
      meal_context: reading.meal_context,
      measured_at: formatDateTime(reading.measured_at),
      notes: reading.notes || '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    const level = Number(formData.glucose_level);

    if (!Number.isInteger(level) || level < 40 || level > 600) {
      setError('Glucose must be an integer between 40 and 600.');
      return;
    }

    try {
      await updateReading(editingId, {
        ...formData,
        glucose_level: level,
        measured_at: new Date(formData.measured_at).toISOString(),
        notes: formData.notes.trim(),
      });

      setEditingId(null);
      await onChanged();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update reading.'
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this reading?'
    );

    if (!confirmed) return;

    setError('');

    try {
      await deleteReading(id);
      await onChanged();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to delete reading.'
      );
    }
  };

  return (
    <section className="report-section">
      <h2>Manage Glucose Readings</h2>

      {error && <div className="error-message">{error}</div>}

      {readings.length === 0 ? (
        <p>No glucose readings available.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Glucose</th>
                <th>Measurement Slot</th>
                <th>Date & Time</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {readings.map((item) => (
                <tr key={item.id}>
                  {editingId === item.id ? (
                    <td colSpan="5">
                      <form onSubmit={handleUpdate} className="reading-form">
                        <label>Glucose Level</label>
                        <input
                          type="number"
                          name="glucose_level"
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
                          required
                        />

                        <label>Notes</label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          maxLength={500}
                        />

                        <button type="submit">Save Changes</button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>{item.glucose_level} mg/dL</td>
                      <td>{item.meal_context.replaceAll('_', ' ')}</td>
                      <td>{new Date(item.measured_at).toLocaleString()}</td>
                      <td>{item.notes || '--'}</td>
                      <td>
                        <button onClick={() => startEditing(item)}>
                          Edit
                        </button>

                        <button onClick={() => handleDelete(item.id)}>
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ReadingList;
