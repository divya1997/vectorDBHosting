'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { XMarkIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const embeddingModels = [
  { id: 'text-embedding-ada-002', name: 'OpenAI Embeddings', description: 'Best for general purpose text embedding' },
  { id: 'huggingface', name: 'HuggingFace', description: 'Open source embedding models' },
];

const chunkSizes = [
  { id: '256', name: '256 tokens' },
  { id: '512', name: '512 tokens' },
  { id: '1024', name: '1024 tokens' },
];

const sectors = [
  { id: 'finance', name: 'Finance' },
  { id: 'health', name: 'Healthcare' },
  { id: 'technology', name: 'Technology' },
  { id: 'education', name: 'Education' },
  { id: 'articles', name: 'Articles' },
  { id: 'other', name: 'Other' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseCreated: (database: any) => void;
}

export function CreateDatabaseModal({ isOpen, onClose, onDatabaseCreated }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSector, setSelectedSector] = useState(sectors[0]);
  const [selectedModel, setSelectedModel] = useState(embeddingModels[0]);
  const [chunkSize, setChunkSize] = useState(chunkSizes[1]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const resetForm = () => {
    setFiles([]);
    setName('');
    setDescription('');
    setSelectedSector(sectors[0]);
    setSelectedModel(embeddingModels[0]);
    setChunkSize(chunkSizes[1]);
    setIsProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('sector', selectedSector.id);
      formData.append('model', selectedModel.id);
      formData.append('chunk_size', chunkSize.id);
      formData.append('user_id', 'user123'); // Add user ID to track ownership
      
      // Append files
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Send request to backend
      const response = await fetch('http://localhost:8000/api/v1/database/create', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create database: ${errorData}`);
      }
      
      const result = await response.json();
      
      // Create new database object
      const newDatabase = {
        id: result.database_id,
        name: name,
        description: description,
        sector: selectedSector.id,
        documentCount: files.length,
        lastUpdated: new Date().toISOString(),
        status: result.status || 'processing',
        created_by: 'user123'
      };

      // First close the modal
      onClose();
      
      // Then notify parent about the new database
      onDatabaseCreated(newDatabase);
      
      // Finally reset the form
      resetForm();
      
    } catch (error) {
      console.error('Error creating database:', error);
      alert(error instanceof Error ? error.message : 'Failed to create database');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={() => {
          console.log('Dialog onClose triggered');
          onClose();
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Create New Database
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Database Name
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Enter database name"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Enter database description"
                          />
                        </div>

                        {/* Sector Selection */}
                        <div>
                          <Listbox value={selectedSector} onChange={setSelectedSector}>
                            <Listbox.Label className="block text-sm font-medium text-gray-700">
                              Sector
                            </Listbox.Label>
                            <div className="relative mt-1">
                              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
                                <span className="block truncate">{selectedSector.name}</span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                </span>
                              </Listbox.Button>
                              <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  {sectors.map((sector) => (
                                    <Listbox.Option
                                      key={sector.id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                                        }`
                                      }
                                      value={sector}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {sector.name}
                                          </span>
                                          {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                              <CheckIcon className="h-5 w-5" />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>

                        {/* File Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Upload Files
                          </label>
                          <input
                            type="file"
                            onChange={handleFileChange}
                            multiple
                            required
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100"
                          />
                        </div>

                        {/* Embedding Model Selection */}
                        <div>
                          <Listbox value={selectedModel} onChange={setSelectedModel}>
                            <Listbox.Label className="block text-sm font-medium text-gray-700">
                              Embedding Model
                            </Listbox.Label>
                            <div className="relative mt-1">
                              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
                                <span className="block truncate">{selectedModel.name}</span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                </span>
                              </Listbox.Button>
                              <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  {embeddingModels.map((model) => (
                                    <Listbox.Option
                                      key={model.id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                                        }`
                                      }
                                      value={model}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {model.name}
                                          </span>
                                          {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                              <CheckIcon className="h-5 w-5" />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>

                        {/* Chunk Size Selection */}
                        <div>
                          <Listbox value={chunkSize} onChange={setChunkSize}>
                            <Listbox.Label className="block text-sm font-medium text-gray-700">
                              Chunk Size
                            </Listbox.Label>
                            <div className="relative mt-1">
                              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
                                <span className="block truncate">{chunkSize.name}</span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                </span>
                              </Listbox.Button>
                              <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  {chunkSizes.map((size) => (
                                    <Listbox.Option
                                      key={size.id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                                        }`
                                      }
                                      value={size}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {size.name}
                                          </span>
                                          {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                              <CheckIcon className="h-5 w-5" />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isProcessing}
                            className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? 'Creating...' : 'Create Database'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
