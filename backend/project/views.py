from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Project, Layer
from .serializers import ProjectSerializer, ProjectListSerializer, LayerSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations.
    
    List: GET /api/projects/
    Create: POST /api/projects/
    Retrieve: GET /api/projects/{id}/
    Update: PUT /api/projects/{id}/
    Partial Update: PATCH /api/projects/{id}/
    Delete: DELETE /api/projects/{id}/
    """
    queryset = Project.objects.all()

    def get_serializer_class(self):
        """Use lightweight serializer for list, full serializer for detail."""
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def create(self, request, *args, **kwargs):
        """Create a new project with optional layers."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data,
                        status=status.HTTP_201_CREATED,
                        headers=headers)

    @action(detail=True, methods=['post'])
    def add_layer(self, request, pk=None):
        """Add a new layer to the project."""
        project = self.get_object()
        serializer = LayerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def layers(self, request, pk=None):
        """Get all layers for a project."""
        project = self.get_object()
        layers = project.layers.all()
        serializer = LayerSerializer(layers, many=True)
        return Response(serializer.data)


class LayerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Layer CRUD operations.
    
    List: GET /api/layers/
    Create: POST /api/layers/
    Retrieve: GET /api/layers/{id}/
    Update: PUT /api/layers/{id}/
    Partial Update: PATCH /api/layers/{id}/
    Delete: DELETE /api/layers/{id}/
    """
    queryset = Layer.objects.all()
    serializer_class = LayerSerializer

    def create(self, request, *args, **kwargs):
        """Create a new layer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Ensure project_id is provided
        if 'project' not in request.data:
            return Response({"error": "project field is required"},
                            status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data,
                        status=status.HTTP_201_CREATED,
                        headers=headers)
