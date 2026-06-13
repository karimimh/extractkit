"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('app.urls')),
    path(
        'api/developer/schema/',
        SpectacularAPIView.as_view(
            urlconf='app.developer_urls',
            custom_settings={
                'TITLE': 'ExtractKit Developer API',
                'DESCRIPTION': 'Public API for asynchronous webpage exports, job history, webhooks, and MCP.',
                'VERSION': '1.0.0',
                'POSTPROCESSING_HOOKS': ['app.schema.public_developer_schema'],
            },
        ),
        name='developer-schema',
    ),
    path(
        'api/developer/docs/',
        SpectacularSwaggerView.as_view(url_name='developer-schema'),
        name='developer-swagger-ui',
    ),
]

if settings.DEBUG:
    urlpatterns += [
        path('api/internal/schema/', SpectacularAPIView.as_view(), name='internal-schema'),
        path('api/internal/docs/', SpectacularSwaggerView.as_view(url_name='internal-schema'), name='internal-swagger-ui'),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
