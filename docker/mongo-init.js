db = db.getSiblingDB('inventra');

db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('suppliers');
db.createCollection('transactions');

print('Inventra database initialized.');
