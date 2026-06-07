from django.contrib import admin
from .models import Project, Layer


class LayerInline(admin.TabularInline):
    """Inline admin for layers."""
    model = Layer
    extra = 0
    fields = ['name', 'layer_id', 'order']
    ordering = ['order']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin for Project model."""
    list_display = [
        'id', 'name', 'width', 'height', 'created_at', 'updated_at'
    ]
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name']
    inlines = [LayerInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Layer)
class LayerAdmin(admin.ModelAdmin):
    """Admin for Layer model."""
    list_display = ['id', 'name', 'layer_id', 'project', 'order', 'created_at']
    list_filter = ['created_at', 'project']
    search_fields = ['name', 'layer_id']
    readonly_fields = ['created_at', 'updated_at']
    list_select_related = ['project']
