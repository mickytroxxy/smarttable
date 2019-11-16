# smarttable
This is where smarttable code and info sit
Please read carefully to understand these APIs. We still using the same concept just like last time on crustcore

The main url is 
ec2-13-58-254-234.us-east-2.compute.amazonaws.com:4300/
so im gonna give it an identifier

var api = "ec2-13-58-254-234.us-east-2.compute.amazonaws.com:4000/";

to log a user in use. Remember the api variable represents our main url
api+"appLogin/email/password/password"; This returns json data.

to request for random items use this
api+"randomItems/companyId";

to request for store details use this
api+"storeDetails/companyId";

to request for all store categories use this
api+"getCategories/companyId";

to get items by category after clicking on the category use this. extract the category id then include it on your request
api+"getItemsByCategory/categoryId";

to place an order use this
api+"order/orderObj/total/total/companyId/companyId/tableNo/tableNo/placedBy/placedBy";
The orderObj should be stringified before you post it. TableNo is required and placedBy will be the email of the logged in waiter

Use these login details to get started
wellie@gmail.com  123456
