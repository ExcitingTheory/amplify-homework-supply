import React from "react";
import { Box, Typography } from "@mui/material";
import { DataStore } from "aws-amplify/datastore";
import { uploadData } from "aws-amplify/storage";
import UnitContext from "../../../context/unitContext";
import { Unit } from "../../../models";
import CameraIcon from '@mui/icons-material/Camera';
import getCachedUrl from "../../../utils/getCachedUrl";
import FilesContext from "../../../context/fileContext";

function FeaturedImage({ style, s3Key, identityId }) {

  const [url, setUrl] = React.useState(null);


  React.useEffect(() => {

    const asyncFunc = async () => {

      const _url = await getCachedUrl(s3Key, 'protected', identityId)

      setUrl(_url);
    }

    asyncFunc();

  }, [s3Key]);

  return <img
    src={url}
    style={style}
  />
}

export default function ConfigurationManager() {

  const [isDragging, setIsDragging] = React.useState(false);
  const [filesToUpload, setFilesToUpload] = React.useState([]);
  const [fileOperations, setFileOperations] = React.useState([]);
  const [inProgress, setInProgress] = React.useState(false);

  const { unit } = React.useContext(UnitContext);

  const {
    session: { identityId }
  } = React.useContext(FilesContext);

  React.useEffect(() => {

    const asyncFunc = async () => {
      // when audio files change, upload them to S3
      // and update the entry in the database


      if (filesToUpload.length === 0) {
        return;
      }
      let newFilename;
      // show loading indicator
      setInProgress(true);


      const fileKeys = await Promise.allSettled(filesToUpload.map(async (fileInput) => {
        const { file } = fileInput;
        console.log('file', file);

        if (file?.type?.includes('image')) {
          newFilename = `featured-images/${file.name}`
        }

        if (!newFilename) {
          throw new Error('Please upload an image file with a valid extension.');
        }

        // TODO - add support for featured video and featured audio
        /**else if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
            newFilename = `audio/${_uuid}-${file.name}`
            // Way to determine length of audio file?
        } else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
            newFilename = `files/${_uuid}-${file.name}`
        }*/

        console.log('uploading newFilename', newFilename);
        console.log('uploading file', fileInput);
        console.log('fileOperations', fileOperations);

        const result = await uploadData({
          key: newFilename,
          data: file,
          options: {
            contentType: file.type,
            contentLength: file.size,
            accessLevel: 'protected',
            identityId,
            progressCallback(progress) {
              console.log(`Uploaded: ${progress.loaded}/${progress.total}`);

              setFileOperations((prev) => {
                const newFileOperations = [...prev];
                newFileOperations[fileInput.index].progress = Math.round(progress.loaded / progress.total * 100) + '%';
                return newFileOperations;
              })
            }
          }
        });

      }));



      // timeout to allow for S3? to update
      setTimeout(async () => {
        setFilesToUpload([]);
        setFileOperations([]);

        // Hide loading indicator

        try {
          // update the unit with the new file
          await DataStore.save(
            Unit.copyOf(unit, (updated) => {
              updated.featuredImage = newFilename;
            }));
  
          console.log('updated unit', unit);
        } catch (error) {
          console.error(error);
        }

        setInProgress(false);

      }, 3000);
    };

    asyncFunc();

  }, [filesToUpload]);

  const handleDragOver = (e) => {
    console.log('handleDragOver');
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const handleDrop = async (event) => {
    console.log('dropped');
    event.preventDefault();
    event.stopPropagation();

    console.log(event.dataTransfer.files);

    const files = Array.from(event.dataTransfer.files);

    console.log('files>>>>', files);

    const _toupload = files.map((f, index) => {
      return {
        file: f,
        index,
      }
    });

    const _fileOperations = files.map((f) => ({ name: f.name, progress: '0%' }));


    console.log('_toupload', _toupload);
    console.log('_fileOperations', _fileOperations);

    setFilesToUpload(_toupload);
    setFileOperations(_fileOperations);

    setIsDragging(false);
  };

  return <Box
    style={{
      display: 'flex',
      flexDirection: 'column',
      // alignItems: 'center',
      // justifyContent: 'center',
      // padding: '1rem',
      // height: '100%',
      // width: '100%',
    }}
  >





    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: '1rem',
        // border: '1px solid black',
        // backgroundColor: 'rgb(255, 255, 255, 0.1)',
      }}

      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={(e) => {
        console.log('onDragLeaveListItem');
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
    >

      {(isDragging || inProgress) && (

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={(e) => {
            console.log('onDragLeave');
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}


          style={{
            color: '#000',
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100,
            backgroundColor: 'rgb(255, 255, 255, 0.5)',
            backdropFilter: 'blur(3px)',
            textAlign: 'center',
            verticalAlign: 'middle',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            wrap: 'wrap',

          }}
        >
          {inProgress &&
          `Uploading Image`
          }
          {isDragging &&
          `Upload Image`
          }
        </div>
      )}


      <Typography
        variant="h6"
        // component="h3"
        sx={{
          flexGrow: 1,
          textWrap: 'wrap',
        }}
      >
        Set Featured Image
      </Typography>

      {/**
         * drag, dro0p and resize image for featured image. If there is no featured image, pull the first image from the content and use that.
         */}

      {unit?.featuredImage &&



        <Box

          style={{
            width: '100%',
            height: '0',
            paddingTop: 'calc(9 / 16 * 100%)',
            position: 'relative',
            backgroundColor: '#ddd'
          }}
        >


          <FeaturedImage
            s3Key={unit.featuredImage}
            identityId={unit.identityId}
            style={{

              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#333',
              backgroundColor: 'rgba(255, 255, 255, 0)'

            }}
          />

        </Box>
      }
      {!unit?.featuredImage &&

        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            // height: '100%',
            // width: '100%',
            border: '1px dashed #666',
          }}
        >
          <Typography
            variant="body1"
            // component="h3"
            sx={{
              flexGrow: 1,
              textWrap: 'wrap',
            }}
          >
            <CameraIcon
              sx={{
                fontSize: '2rem',
                margin: '1rem auto',
                display: 'block',
              }}
            /><br />
            No featured image set.
            Drag and drop an image here to set it as the featured image.
          </Typography>
        </Box>
      }

    </div>


  </Box>
}

