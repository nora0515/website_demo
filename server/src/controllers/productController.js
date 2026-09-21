import Product from '../models/Product.js';

// Names starting with these come first, in this order.
const FEATURED = ['짱', '탄'];

function publicProduct(product) {
  const result = product.toObject();
  delete result.__v;
  return result;
}

export async function createProduct(req, res) {
  const product = new Product(req.body);
  await product.validate();
  if (await Product.exists({ sku: product.sku })) {
    return res.status(409).json({ message: 'This SKU is already registered.' });
  }
  await product.save();
  res.status(201).location(`/api/products/${product.id}`).json({ product: publicProduct(product) });
}

export async function getProducts(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit)
    || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
    return res.status(400).json({ message: 'page must be a positive integer; limit must be between 1 and 100.' });
  }
  const filter = req.query.category === undefined ? {} : { category: req.query.category };
  const skip = (page - 1) * limit;

  // Sorting happens here rather than in the browser: with pagination the client
  // only ever holds one page, so it cannot order the whole catalogue.
  const query = req.query.sort === 'recommended'
    ? Product.aggregate([
      { $match: filter },
      // Featured prefixes first, everything else after.
      {
        $addFields: {
          rank: {
            $switch: {
              branches: FEATURED.map((prefix, index) => ({
                // $substrCP counts code points, so it does not split a Hangul
                // character the way the byte-based $substr would.
                case: { $eq: [{ $substrCP: ['$name', 0, 1] }, prefix] },
                then: index,
              })),
              default: FEATURED.length,
            },
          },
        },
      },
      { $sort: { rank: 1, name: 1, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { __v: 0, rank: 0 } },
    // Korean collation puts 가나다 in the order a reader expects.
    ]).collation({ locale: 'ko' })
    : Product.find(filter).select('-__v').sort({ createdAt: -1, _id: -1 })
      .skip(skip).limit(limit);

  const [products, total] = await Promise.all([query, Product.countDocuments(filter)]);
  res.json({ products, page, limit, total });
}

export async function getProductById(req, res) {
  const product = await Product.findById(req.params.id).select('-__v');
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ product });
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  product.set(req.body);
  await product.validate();
  // Mongoose uppercases sku on set, so this compares the stored form.
  if (product.isModified('sku') && await Product.exists({ sku: product.sku, _id: { $ne: product.id } })) {
    return res.status(409).json({ message: 'This SKU is already registered.' });
  }
  await product.save();
  res.json({ product: publicProduct(product) });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.status(204).end();
}
