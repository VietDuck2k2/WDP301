/**
 * Standard API Response Helper
 */
class ApiResponse {
   /**
    * Success response (200)
    */
   static ok(res, data = null, message = 'Success') {
      return res.status(200).json({
         success: true,
         message,
         data
      });
   }

   /**
    * Created response (201)
    */
   static created(res, data = null, message = 'Resource created successfully') {
      return res.status(201).json({
         success: true,
         message,
         data
      });
   }

   /**
    * No content response (204)
    */
   static noContent(res) {
      return res.status(204).send();
   }

   /**
    * Custom success response
    */
   static success(res, statusCode, data = null, message = 'Success') {
      return res.status(statusCode).json({
         success: true,
         message,
         data
      });
   }
}

module.exports = ApiResponse;
