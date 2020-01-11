base url is http://techapis.xyz:4400/

Register a new patient with 

baseUrl/register/patientName/patientSurname/patientSurname/patientBdae/patientBdae/patientAddress/patientAddress/patientEmail/patientEmail/patientPhone/patientPhone/patientGender/patientGender/patientPassword/patientPassword/addedBy/addedBy/nextOfKin1/nextOfKin1/nextOfKin2/nextOfKin2

The above request returns the id as the file number on success, returns 0 on failure

Get patient details 

baseUrl/getMyDetails/fileNo

The above url returns json data

Get patient medical Records

baseUrl/getMedicalHistory/fileNo

The above url returns json data

//GET all doctors
baseUrl/getAllPractitioners
//returns json data

//get practitioners By city
baseUrl/getPractitionersByCity/specialization/country/country/city/city
//returns json data

//get practitioner By Email
baseUrl/getPractitionerByEmail/emailAddress
//returns json data

//get practitioners By distance
baseUrl/getPractitionersByDistance/specialization/latitude/latitude/longitude/longitude
//returns json data

//setup appointment
baseUrl/setAppointment/fileNo/patientName/patientName/contact/contact/reason/reason/preferredTime/preferredTime/practitionerId/practitionerId
//returns bolean, true for success, false for error

//Login use 

baseUrl/patientLogin/patientEmail/patientPassword/patientPassword
//returns json data

//get all my appointments
baseUrl/getMyAppointments/fileNo
//returns json data

//get police posts/warnings
baseUrl/getPolicePosts/latitude/longitude/longitude
//returns json data

//post a tip of to the nearest police... About tip of could be rape, fraud, robbery etc. SendBy police will only be saved on our database but it wont be published to the police
/postTipOf/latitude/longitude/longitude/aboutTipOf/aboutTipOf/details/details/location/location/timeSend/timeSend/sendBy/sendBy
//returns json data
