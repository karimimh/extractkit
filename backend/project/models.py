from django.db import models
import json


class Project(models.Model):
    """Project model with width, height and layers."""
    name = models.CharField(max_length=255, blank=True, default='')
    width = models.IntegerField()
    height = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Project {self.id} - {self.width}x{self.height}"


class Layer(models.Model):
    """Layer model with objects stored as JSON."""
    project = models.ForeignKey(Project,
                                related_name='layers',
                                on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    layer_id = models.CharField(max_length=255)  # Frontend layer ID
    objects_data = models.JSONField(default=dict, blank=True)  # {id: object}
    object_orders = models.JSONField(default=list,
                                     blank=True)  # [id1, id2, ...]
    order = models.IntegerField(default=0)  # Order in the project
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
        unique_together = [['project', 'layer_id']]

    def __str__(self):
        return f"{self.name} (Project {self.project_id})"
