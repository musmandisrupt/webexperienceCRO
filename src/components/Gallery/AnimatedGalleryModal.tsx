'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { safeLocaleDateString } from '@/lib/dateUtils'
import toast from 'react-hot-toast'
import type { Competitor, LandingPage } from '@/types'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from '@/components/ui/animated-modal'

interface GalleryImage {
  id: string
  url: string
  title: string
  competitorName: string
  capturedAt: Date
  screenshotUrl: string
}

interface AnimatedGalleryModalProps {
  competitor: Competitor | null
  onImageDeleted?: () => void
  trigger: React.ReactNode
}

export default function AnimatedGalleryModal({ competitor, onImageDeleted, trigger }: AnimatedGalleryModalProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null)

  const fetchCompetitorImages = async (competitorId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/landing-pages?competitorId=${competitorId}`)
      const data = await response.json()
      
      if (data.success) {
        const galleryImages: GalleryImage[] = data.landingPages
          .filter((page: LandingPage) => page.screenshotUrl)
          .map((page: LandingPage) => ({
            id: page.id,
            url: page.url,
            title: page.title || 'Untitled',
            competitorName: competitor?.name || 'Unknown',
            capturedAt: new Date(page.capturedAt),
            screenshotUrl: page.screenshotUrl || ''
          }))
        
        setImages(galleryImages)
        setSelectedImageIndex(0)
        setZoom(1)
      }
    } catch (error) {
      console.error('Failed to fetch images:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
    setZoom(1)
  }

  const previousImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
    setZoom(1)
  }

  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5))
  }

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const resetZoom = () => {
    setZoom(1)
  }

  const handleDeleteImage = async (image: GalleryImage) => {
    setImageToDelete(image)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!imageToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/landing-pages/${imageToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      const updatedImages = images.filter(img => img.id !== imageToDelete.id)
      setImages(updatedImages)

      if (updatedImages.length === 0) {
        toast.success('All images deleted')
        return
      }

      if (selectedImageIndex >= updatedImages.length) {
        setSelectedImageIndex(updatedImages.length - 1)
      }

      toast.success('Image deleted successfully')
      
      if (onImageDeleted) {
        onImageDeleted()
      }
      
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setImageToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setImageToDelete(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        zoomIn()
      } else {
        zoomOut()
      }
    }
  }

  // Fetch images when competitor changes
  useEffect(() => {
    if (competitor?.id) {
      fetchCompetitorImages(competitor.id)
    }
  }, [competitor?.id])

  const currentImage = images[selectedImageIndex]

  return (
    <Modal>
      <ModalTrigger className="w-full">
        {trigger}
      </ModalTrigger>
      <ModalBody className="min-h-[80%] max-h-[95%] md:max-w-[90%] lg:max-w-[80%]">
        <ModalContent className="p-0">
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <div>
              <h3 className="text-lg font-medium text-white">
                {competitor?.name} - Gallery
              </h3>
              <p className="text-sm text-gray-300">
                {images.length} landing page{images.length !== 1 ? 's' : ''} captured
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-gray-700 rounded-md border border-gray-600 p-1">
                <button
                  onClick={zoomOut}
                  className="p-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded"
                  title="Zoom Out (Ctrl/Cmd + -)"
                >
                  <MagnifyingGlassMinusIcon className="h-4 w-4" />
                </button>
                <span className="text-xs text-gray-300 px-2 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className="p-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded"
                  title="Zoom In (Ctrl/Cmd + +)"
                >
                  <MagnifyingGlassPlusIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="text-xs text-gray-400 hover:text-gray-200 px-2 border-l border-gray-600"
                  title="Reset Zoom (0)"
                >
                  Reset
                </button>
              </div>

              {/* Delete Button */}
              {currentImage && (
                <button
                  onClick={() => handleDeleteImage(currentImage)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete this screenshot"
                  disabled={isDeleting}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 bg-gray-900 flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-500">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-white">No images yet</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Capture some landing pages to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 h-full flex flex-col">
                {/* Thumbnail Grid */}
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border-b border-gray-700 pb-4">
                    {images.map((image, index) => (
                      <motion.div 
                        key={image.id} 
                        className="relative group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={() => {
                            setSelectedImageIndex(index)
                            setZoom(1)
                          }}
                          className={`relative w-full rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex
                              ? 'border-primary-500 ring-2 ring-primary-400'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <img
                            src={image.screenshotUrl}
                            alt={image.title}
                            className="w-full h-20 object-cover"
                          />
                          {index === selectedImageIndex && (
                            <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                            </div>
                          )}
                          
                          {/* URL Tooltip Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-center">
                            <span className="break-words max-w-full">
                              {image.url.length > 60 ? `${image.url.substring(0, 60)}...` : image.url}
                            </span>
                          </div>
                        </button>
                        
                        {/* Delete button for each thumbnail */}
                        <button
                          onClick={() => handleDeleteImage(image)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Delete this screenshot"
                          disabled={isDeleting}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Main Image Viewer with Zoom */}
                <div onWheel={handleWheel} className="relative bg-gray-800 rounded-lg flex-1 overflow-auto">
                  <div className="flex items-center justify-center min-h-[60vh] p-4">
                    <motion.img
                      src={currentImage?.screenshotUrl}
                      alt={currentImage?.title}
                      className="max-w-full max-h-full object-contain transition-transform duration-200 ease-in-out"
                      style={{ 
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center',
                        cursor: zoom > 1 ? 'grab' : 'zoom-in'
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      key={selectedImageIndex}
                    />
                  </div>
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <motion.button
                        onClick={previousImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-90 transition-all z-10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-90 transition-all z-10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </motion.button>
                    </>
                  )}

                  {/* Zoom Indicator */}
                  <motion.div 
                    className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {Math.round(zoom * 100)}%
                  </motion.div>
                </div>

                {/* Image Info */}
                <div className="text-center">
                  <h4 className="text-lg font-medium text-white">
                    {currentImage?.title}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {currentImage?.url}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Captured {safeLocaleDateString(currentImage?.capturedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <motion.div 
              className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-gray-800 rounded-lg p-6 max-w-md mx-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 bg-opacity-20">
                    <TrashIcon className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Delete Screenshot</h3>
                  <p className="text-sm text-gray-300 mb-6">
                    Are you sure you want to delete this screenshot? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={cancelDelete}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </ModalContent>
      </ModalBody>
    </Modal>
  )
}
