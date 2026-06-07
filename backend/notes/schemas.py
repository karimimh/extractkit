"""
Swagger/OpenAPI schemas for the notes app
"""
from drf_yasg import openapi

# Filter parameters for notes list endpoint
NOTES_LIST_FILTER_PARAMETERS = [
    openapi.Parameter(
        'search',
        openapi.IN_QUERY,
        description="Search term to filter notes by title or content",
        type=openapi.TYPE_STRING,
        required=False),
    openapi.Parameter('is_pinned',
                      openapi.IN_QUERY,
                      description="Filter by pinned status (true/false)",
                      type=openapi.TYPE_BOOLEAN,
                      required=False),
    openapi.Parameter('content_type',
                      openapi.IN_QUERY,
                      description="Filter by content type (text/markdown)",
                      type=openapi.TYPE_STRING,
                      enum=['text', 'markdown'],
                      required=False),
    openapi.Parameter(
        'labels',
        openapi.IN_QUERY,
        description="Filter by label IDs (comma-separated, e.g., '1,2,3')",
        type=openapi.TYPE_STRING,
        required=False),
    openapi.Parameter(
        'created_after',
        openapi.IN_QUERY,
        description="Filter notes created after this date (YYYY-MM-DD)",
        type=openapi.TYPE_STRING,
        format='date',
        required=False),
    openapi.Parameter(
        'created_before',
        openapi.IN_QUERY,
        description="Filter notes created before this date (YYYY-MM-DD)",
        type=openapi.TYPE_STRING,
        format='date',
        required=False),
    openapi.Parameter(
        'updated_after',
        openapi.IN_QUERY,
        description="Filter notes updated after this date (YYYY-MM-DD)",
        type=openapi.TYPE_STRING,
        format='date',
        required=False),
    openapi.Parameter(
        'updated_before',
        openapi.IN_QUERY,
        description="Filter notes updated before this date (YYYY-MM-DD)",
        type=openapi.TYPE_STRING,
        format='date',
        required=False),
    openapi.Parameter('order_by',
                      openapi.IN_QUERY,
                      description="Field to order by",
                      type=openapi.TYPE_STRING,
                      enum=[
                          'updated_at', 'created_at', 'title', 'content_type',
                          'color', 'bg_color', 'order'
                      ],
                      required=False),
    openapi.Parameter(
        'order_direction',
        openapi.IN_QUERY,
        description="Order direction (asc for ascending, desc for descending)",
        type=openapi.TYPE_STRING,
        enum=['asc', 'desc'],
        required=False),
    openapi.Parameter(
        'color',
        openapi.IN_QUERY,
        description="Filter by text color (hex format, e.g., #FF0000)",
        type=openapi.TYPE_STRING,
        required=False),
    openapi.Parameter(
        'bg_color',
        openapi.IN_QUERY,
        description="Filter by background color (hex format, e.g., #FFFF00)",
        type=openapi.TYPE_STRING,
        required=False),
    openapi.Parameter('page',
                      openapi.IN_QUERY,
                      description="Page number (default: 1)",
                      type=openapi.TYPE_INTEGER,
                      required=False),
    openapi.Parameter(
        'page_size',
        openapi.IN_QUERY,
        description="Number of items per page (default: 20, max: 100)",
        type=openapi.TYPE_INTEGER,
        required=False),
]

# Filter parameters for labels list endpoint
LABEL_LIST_FILTER_PARAMETERS = [
    openapi.Parameter('search',
                      openapi.IN_QUERY,
                      description="Search term to filter labels by name",
                      type=openapi.TYPE_STRING,
                      required=False),
    openapi.Parameter(
        'color',
        openapi.IN_QUERY,
        description="Filter by label color (hex format, e.g., #2196F3)",
        type=openapi.TYPE_STRING,
        required=False),
    openapi.Parameter('order_by',
                      openapi.IN_QUERY,
                      description="Field to order by",
                      type=openapi.TYPE_STRING,
                      enum=['name', 'color', 'created_at', 'updated_at'],
                      required=False),
    openapi.Parameter(
        'order_direction',
        openapi.IN_QUERY,
        description="Order direction (asc for ascending, desc for descending)",
        type=openapi.TYPE_STRING,
        enum=['asc', 'desc'],
        required=False),
]

# Label schema for responses
LABEL_SCHEMA = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id':
        openapi.Schema(type=openapi.TYPE_INTEGER),
        'name':
        openapi.Schema(type=openapi.TYPE_STRING),
        'color':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Label color in hex format (e.g., #2196F3)',
                       pattern='^#[0-9A-Fa-f]{6}$',
                       example='#2196F3'),
        'created_at':
        openapi.Schema(type=openapi.TYPE_STRING, format='date-time'),
        'updated_at':
        openapi.Schema(type=openapi.TYPE_STRING, format='date-time'),
        'notes_count':
        openapi.Schema(type=openapi.TYPE_INTEGER,
                       description='Number of notes with this label')
    })

# Common note schema for responses
NOTE_SCHEMA = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id':
        openapi.Schema(type=openapi.TYPE_INTEGER),
        'title':
        openapi.Schema(type=openapi.TYPE_STRING),
        'content':
        openapi.Schema(type=openapi.TYPE_STRING),
        'content_type':
        openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=['text', 'markdown'],
            description=
            'Content type: text for plain text, markdown for markdown'),
        'is_pinned':
        openapi.Schema(type=openapi.TYPE_BOOLEAN,
                       description='Whether the note is pinned'),
        'pin_order':
        openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description='Order index for pinned notes (lower = higher priority)'
        ),
        'color':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Text color in hex format (e.g., #000000)',
                       pattern='^#[0-9A-Fa-f]{6}$',
                       example='#000000'),
        'bg_color':
        openapi.Schema(
            type=openapi.TYPE_STRING,
            description='Background color in hex format (e.g., #ffffff)',
            pattern='^#[0-9A-Fa-f]{6}$',
            example='#ffffff'),
        'rendered_content':
        openapi.Schema(
            type=openapi.TYPE_STRING,
            description='HTML rendered content (only for markdown content_type)'
        ),
        'images':
        openapi.Schema(type=openapi.TYPE_ARRAY,
                       items=openapi.Schema(
                           type=openapi.TYPE_OBJECT,
                           properties={
                               'id':
                               openapi.Schema(type=openapi.TYPE_INTEGER),
                               'image':
                               openapi.Schema(type=openapi.TYPE_STRING,
                                              format='uri'),
                               'alt_text':
                               openapi.Schema(type=openapi.TYPE_STRING),
                               'uploaded_at':
                               openapi.Schema(type=openapi.TYPE_STRING,
                                              format='date-time')
                           })),
        'labels':
        openapi.Schema(type=openapi.TYPE_ARRAY,
                       items=LABEL_SCHEMA,
                       description='Labels assigned to this note'),
        'order':
        openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description='Custom order index for user-defined sorting',
            example=0),
        'created_at':
        openapi.Schema(type=openapi.TYPE_STRING, format='date-time'),
        'updated_at':
        openapi.Schema(type=openapi.TYPE_STRING, format='date-time')
    })

# Request schemas
NOTE_CREATE_REQUEST_SCHEMA = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'title':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Optional title for the note'),
        'content':
        openapi.Schema(type=openapi.TYPE_STRING),
        'content_type':
        openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=['text', 'markdown'],
            default='markdown',
            description=
            'Content type: text for plain text, markdown for markdown'),
        'labels':
        openapi.Schema(type=openapi.TYPE_ARRAY,
                       items=openapi.Schema(type=openapi.TYPE_INTEGER),
                       description='Array of label IDs to assign to the note'),
        'color':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Text color in hex format (e.g., #000000)',
                       pattern='^#[0-9A-Fa-f]{6}$',
                       example='#000000'),
        'bg_color':
        openapi.Schema(
            type=openapi.TYPE_STRING,
            description='Background color in hex format (e.g., #ffffff)',
            pattern='^#[0-9A-Fa-f]{6}$',
            example='#ffffff'),
        'order':
        openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description='Custom order index for user-defined sorting',
            default=0,
            example=0)
    },
    required=['content'])

NOTE_UPDATE_REQUEST_SCHEMA = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'title':
        openapi.Schema(type=openapi.TYPE_STRING),
        'content':
        openapi.Schema(type=openapi.TYPE_STRING),
        'content_type':
        openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=['text', 'markdown'],
            description=
            'Content type: text for plain text, markdown for markdown'),
        'labels':
        openapi.Schema(type=openapi.TYPE_ARRAY,
                       items=openapi.Schema(type=openapi.TYPE_INTEGER),
                       description='Array of label IDs to assign to the note'),
        'color':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Text color in hex format (e.g., #000000)',
                       pattern='^#[0-9A-Fa-f]{6}$',
                       example='#000000'),
        'bg_color':
        openapi.Schema(
            type=openapi.TYPE_STRING,
            description='Background color in hex format (e.g., #ffffff)',
            pattern='^#[0-9A-Fa-f]{6}$',
            example='#ffffff'),
        'order':
        openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description='Custom order index for user-defined sorting',
            example=0)
    })

# Label request schemas
LABEL_CREATE_REQUEST_SCHEMA = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'name':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Label name (max 50 characters)'),
        'color':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Label color in hex format (e.g., #2196F3)',
                       pattern='^#[0-9A-Fa-f]{6}$',
                       example='#2196F3',
                       default='#2196F3')
    },
    required=['name'])

LABEL_UPDATE_REQUEST_SCHEMA = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'name':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Label name (max 50 characters)'),
        'color':
        openapi.Schema(type=openapi.TYPE_STRING,
                       description='Label color in hex format (e.g., #2196F3)',
                       pattern='^#[0-9A-Fa-f]{6}$',
                       example='#2196F3')
    })

# Image upload parameters (for form data)
IMAGE_UPLOAD_REQUEST_PARAMETERS = [
    openapi.Parameter('image',
                      openapi.IN_FORM,
                      description='Image file to upload',
                      type=openapi.TYPE_FILE,
                      required=True),
    openapi.Parameter('alt_text',
                      openapi.IN_FORM,
                      description='Alternative text for the image',
                      type=openapi.TYPE_STRING,
                      required=False)
]

IMAGE_UPLOAD_RESPONSE_SCHEMA = openapi.Response(
    'Image uploaded successfully',
    openapi.Schema(type=openapi.TYPE_OBJECT,
                   properties={
                       'id':
                       openapi.Schema(type=openapi.TYPE_INTEGER),
                       'image':
                       openapi.Schema(type=openapi.TYPE_STRING, format='uri'),
                       'alt_text':
                       openapi.Schema(type=openapi.TYPE_STRING),
                       'uploaded_at':
                       openapi.Schema(type=openapi.TYPE_STRING,
                                      format='date-time')
                   }))

# Response schemas
NOTES_LIST_RESPONSE_SCHEMA = openapi.Response(
    'Notes list with pagination',
    openapi.Schema(type=openapi.TYPE_OBJECT,
                   properties={
                       'notes':
                       openapi.Schema(type=openapi.TYPE_ARRAY,
                                      items=NOTE_SCHEMA),
                       'pagination':
                       openapi.Schema(
                           type=openapi.TYPE_OBJECT,
                           properties={
                               'page':
                               openapi.Schema(type=openapi.TYPE_INTEGER),
                               'page_size':
                               openapi.Schema(type=openapi.TYPE_INTEGER),
                               'total_pages':
                               openapi.Schema(type=openapi.TYPE_INTEGER),
                               'total_count':
                               openapi.Schema(type=openapi.TYPE_INTEGER),
                               'has_next':
                               openapi.Schema(type=openapi.TYPE_BOOLEAN),
                               'has_previous':
                               openapi.Schema(type=openapi.TYPE_BOOLEAN),
                           })
                   }))

NOTE_DETAIL_RESPONSE_SCHEMA = openapi.Response('Note details', NOTE_SCHEMA)
NOTE_NOT_FOUND_RESPONSE_SCHEMA = openapi.Response('Note not found')
NOTE_DELETED_RESPONSE_SCHEMA = openapi.Response('Note deleted successfully')

# Label response schemas
LABEL_LIST_RESPONSE_SCHEMA = openapi.Response(
    'Labels list',
    openapi.Schema(type=openapi.TYPE_OBJECT,
                   properties={
                       'labels':
                       openapi.Schema(type=openapi.TYPE_ARRAY,
                                      items=LABEL_SCHEMA)
                   }))

LABEL_DETAIL_RESPONSE_SCHEMA = openapi.Response('Label details', LABEL_SCHEMA)
LABEL_NOT_FOUND_RESPONSE_SCHEMA = openapi.Response('Label not found')
LABEL_DELETED_RESPONSE_SCHEMA = openapi.Response('Label deleted successfully')

# Notes version response schema
NOTES_VERSION_RESPONSE_SCHEMA = openapi.Response(
    'Notes version information',
    openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'version':
            openapi.Schema(
                type=openapi.TYPE_STRING,
                description=
                'ISO timestamp of the most recently updated note, or null if no notes exist'
            ),
            'count':
            openapi.Schema(type=openapi.TYPE_INTEGER,
                           description='Total number of notes')
        }))

# Note action response schemas (for pin operations)
NOTE_PIN_RESPONSE_SCHEMA = openapi.Response(
    description="Pin status toggled successfully",
    schema=openapi.Schema(type=openapi.TYPE_OBJECT,
                          properties={
                              'id':
                              openapi.Schema(type=openapi.TYPE_INTEGER),
                              'is_pinned':
                              openapi.Schema(type=openapi.TYPE_BOOLEAN),
                              'pin_order':
                              openapi.Schema(type=openapi.TYPE_INTEGER),
                              'message':
                              openapi.Schema(type=openapi.TYPE_STRING)
                          }))

# Image delete response schemas
IMAGE_DELETE_RESPONSE_SCHEMA = openapi.Response(
    description="Image deleted successfully")
# Download parameters
DOWNLOAD_FORMAT_PARAMETER = openapi.Parameter(
    'download_format',
    openapi.IN_QUERY,
    description="Download format: 'txt', 'md', or 'pdf'",
    type=openapi.TYPE_STRING,
    required=True,
    enum=['txt', 'md', 'pdf'])

USE_COLORS_PARAMETER = openapi.Parameter(
    'use_colors',
    openapi.IN_QUERY,
    description=
    "Whether to use note's background and text colors in PDF (only applies to PDF format). Default is true.",
    type=openapi.TYPE_BOOLEAN,
    required=False,
    default=True)

DOWNLOAD_FILE_RESPONSE_SCHEMA = openapi.Response(
    description="File download", schema=openapi.Schema(type=openapi.TYPE_FILE))

DOWNLOAD_INVALID_FORMAT_RESPONSE_SCHEMA = openapi.Response(
    description="Invalid format parameter")
