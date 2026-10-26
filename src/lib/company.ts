// The company behind MYAH, shown on the legal pages and in footers.
// UK law (Company Trading Disclosures Regulations 2015) needs the name,
// number, place of registration and registered office address on the site.
// TODO(owner): fill in NUMBER and OFFICE (a registered office service address
// is fine; it does not have to be a home address).
export const COMPANY = {
  name: 'Myah Sits Ltd',
  number: '',
  registeredIn: 'England and Wales',
  office: '',
  email: 'info@myahsits.com',
};

/** "Myah Sits Ltd, registered in England and Wales (company number …), registered office: …" */
export const companyLine = () =>
  [
    `${COMPANY.name}, a company registered in ${COMPANY.registeredIn}`,
    `company number ${COMPANY.number || '[company number to add]'}`,
    `registered office ${COMPANY.office || '[registered office address to add]'}`,
  ].join(', ');
