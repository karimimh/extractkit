from rest_framework import serializers
from .models import Project, Layer


class LayerSerializer(serializers.ModelSerializer):
    """Serializer for Layer model."""

    class Meta:
        model = Layer
        fields = [
            'id', 'layer_id', 'name', 'objects_data', 'object_orders', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model with nested layers."""
    layers = LayerSerializer(many=True, required=False)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'width', 'height', 'layers', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Create project with nested layers."""
        layers_data = validated_data.pop('layers', [])
        project = Project.objects.create(**validated_data)

        for layer_data in layers_data:
            Layer.objects.create(project=project, **layer_data)

        return project

    def update(self, instance, validated_data):
        """Update project and handle nested layers."""
        layers_data = validated_data.pop('layers', None)

        # Update project fields
        instance.name = validated_data.get('name', instance.name)
        instance.width = validated_data.get('width', instance.width)
        instance.height = validated_data.get('height', instance.height)
        instance.save()

        # Update layers if provided
        if layers_data is not None:
            # Get existing layer IDs
            existing_layer_ids = {
                layer.layer_id: layer
                for layer in instance.layers.all()
            }
            provided_layer_ids = set()

            for layer_data in layers_data:
                layer_id = layer_data.get('layer_id')
                provided_layer_ids.add(layer_id)

                if layer_id in existing_layer_ids:
                    # Update existing layer
                    layer = existing_layer_ids[layer_id]
                    for key, value in layer_data.items():
                        setattr(layer, key, value)
                    layer.save()
                else:
                    # Create new layer
                    Layer.objects.create(project=instance, **layer_data)

            # Delete layers that weren't provided
            layers_to_delete = set(
                existing_layer_ids.keys()) - provided_layer_ids
            if layers_to_delete:
                instance.layers.filter(layer_id__in=layers_to_delete).delete()

        return instance


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing projects."""
    layers_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'width', 'height', 'layers_count', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_layers_count(self, obj):
        """Return the count of layers in the project."""
        return obj.layers.count()
