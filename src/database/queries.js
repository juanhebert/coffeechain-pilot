const path = require('path');
const { QueryFile } = require('pg-promise');

const sql = file => {
  const fullPath = path.join(__dirname, file);
  return new QueryFile(fullPath, { minify: true });
};

module.exports = {
  resetSchema: sql('schema.sql'),
  getActorCertificates: sql('getActorCertificates.sql'),
  getActorInventory: sql('getActorInventory.sql'),
  getActorOwnership: sql('getActorOwnership.sql'),
  getActorPractices: sql('getActorPractices.sql'),
  getActors: sql('getActors.sql'),
  getAttachments: sql('getAttachments.sql'),
  getCertificate: sql('getCertificate.sql'),
  getEvents: sql('getEvents.sql'),
  getPractice: sql('getPractice.sql'),
  getSale: sql('getSale.sql'),
  getSaleInputs: sql('getSaleInputs.sql'),
  getShipment: sql('getShipment.sql'),
  getShipmentInputs: sql('getShipmentInputs.sql'),
  getTransformation: sql('getTransformation.sql'),
  getTransformationInputs: sql('getTransformationInputs.sql'),
  getTransformationOutputs: sql('getTransformationOutputs.sql'),
  newActor: sql('newActor.sql'),
  newAttachment: sql('newAttachment.sql'),
  newCertificate: sql('newCertificate.sql'),
  newPractice: sql('newPractice.sql'),
  newProduct: sql('newProduct.sql'),
  newSale: sql('newSale.sql'),
  newSaleInput: sql('newSaleInput.sql'),
  newShipment: sql('newShipment.sql'),
  newShipmentInput: sql('newShipmentInput.sql'),
  newTransformation: sql('newTransformation.sql'),
  newTransformationInput: sql('newTransformationInput.sql'),
  newTransformationOutput: sql('newTransformationOutput.sql'),
};
