import multer from "multer"

const storage = multer.diskStorage ({
    destination : function (req, file, cb){
        cb(null, "./public/temp") // Directory where files will be saved
        // cb -> callback function
    },
    filename : function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round
        (Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({storage : storage})
export {upload}  
 
//Multer can temporarily store uploaded files in memory or on disk before sending them to Cloudinary.
// This is useful if you want to:
// Validate the file (e.g., file type or size) before uploading it to Cloudinary.
// Preprocess the file (e.g., resizing or compression).
//Multer is a Node.js middleware used for handling multipart/form-data, which is primarily used for uploading files in web applications.
// It Stores the files either in memory or on the server's file system.
// Disk Storage: Saves files directly to the server's disk.
// Memory Storage: Stores files in memory as a buffer, useful for further processing.

// Workflow: Multer + Cloudinary
// Here’s how Multer and Cloudinary can work together:

// Multer Handles the Upload:
// Use Multer as middleware to parse the form data and access the uploaded file.

// Send the File to Cloudinary:
// Instead of storing the file locally, upload it to Cloudinary using their API.

// Return Cloudinary URL:
