import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// findOneAndUpdate with $inc is atomic, so two orders placed at the same moment
// can never be handed the same number.
export async function nextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true },
  );
  return counter.seq;
}

export default Counter;
